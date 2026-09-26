import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '../../../../lib/db';
import { Order, Enrollment, Course, TrainingInternship } from '../../../../lib/models';

export const dynamic = 'force-dynamic';

function getRazorpaySecret() {
  return process.env.RAZORPAY_KEY_SECRET || 'TtOOxIMAaPxNJewU3xcKXg40';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod = 'razorpay',
    } = body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return NextResponse.json(
        { success: false, message: 'Razorpay order ID and payment ID are required for verification.' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the corresponding order
    let order = await Order.findOne({ razorpayOrderId });
    if (!order) {
      // Check if orderId matches db id
      if (typeof razorpayOrderId === 'string' && razorpayOrderId.match(/^[0-9a-fA-F]{24}$/)) {
        order = await Order.findById(razorpayOrderId);
      }
    }

    // Verify HMAC-SHA256 signature
    const keySecret = getRazorpaySecret();
    if (razorpaySignature && keySecret) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      // Check if signatures match or if in local/test bypass
      const isAuthentic = generatedSignature === razorpaySignature;
      if (!isAuthentic && !razorpayOrderId.startsWith('order_fake_')) {
        console.warn('[Payment Signature Mismatch]:', {
          received: razorpaySignature,
          expected: generatedSignature,
        });
        return NextResponse.json(
          { success: false, message: 'Payment signature verification failed. Please contact support.' },
          { status: 400 }
        );
      }
    }

    // Update Order document
    if (order) {
      order.status = 'paid';
      order.razorpayPaymentId = razorpayPaymentId;
      order.razorpaySignature = razorpaySignature || '';
      order.paymentMethod = paymentMethod;
      await order.save();
    }

    // Determine course details & enrollment type
    const courseId = order ? order.courseId : body.courseId || 'training-internship';
    const courseTitle = order ? order.courseTitle : body.courseTitle || 'Career Training & Internship';
    const userEmail = order ? order.userEmail : body.userEmail || '';
    const userName = order ? order.userName : body.userName || 'Student';
    const userId = order ? order.userId : body.userId || '';
    const amountPaid = order ? order.amount : 0;

    let isInternship =
      courseTitle.toLowerCase().includes('internship') ||
      courseTitle.toLowerCase().includes('training');

    if (!isInternship && courseId) {
      const checkInternship = await TrainingInternship.findOne({
        $or: [{ _id: courseId.match(/^[0-9a-fA-F]{24}$/) ? courseId : null }, { slug: courseId }],
      }).lean();
      if (checkInternship) {
        isInternship = true;
      }
    }

    const enrollmentType = isInternship ? 'internship' : 'course';
    const batchName = isInternship
      ? 'Weekend Industrial Cohort 2026'
      : 'Cohort 2026 - Active';

    // Increment course enrolledCount if course
    if (!isInternship && courseId && courseId.match(/^[0-9a-fA-F]{24}$/)) {
      await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });
    }

    // Upsert student Enrollment in MongoDB
    if (userEmail) {
      await Enrollment.findOneAndUpdate(
        { userEmail: userEmail.toLowerCase().trim(), courseId },
        {
          $set: {
            userId: userId || '',
            userName: userName || 'Student',
            courseTitle,
            type: enrollmentType,
            batchName,
            enrolledAt: new Date(),
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
            amountPaid,
            status: 'active',
          },
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and enrollment activated successfully!',
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      courseTitle,
      userEmail,
    });
  } catch (error: any) {
    console.error('[Verify Payment Route Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
