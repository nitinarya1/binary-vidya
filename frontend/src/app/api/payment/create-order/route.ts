import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { Course, TrainingInternship, Order, Enrollment, Coupon } from '../../../../lib/models';
import { FRONTEND_INTERNSHIP_PROGRAM } from '../../../../lib/trainingProgramData';
import { validateAndApplyCoupon } from '../../../../lib/coupon-helpers';

export const dynamic = 'force-dynamic';

function getRazorpayKeys() {
  const key_id =
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    'rzp_live_Tfq3IKESmuLNdd';
  const key_secret =
    process.env.RAZORPAY_KEY_SECRET ||
    'TtOOxIMAaPxNJewU3xcKXg40';
  return { key_id, key_secret };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      courseId,
      userEmail,
      userName = 'Student',
      userId = '',
      couponCode,
    } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, message: 'Program or Course ID is required.' },
        { status: 400 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: 'Valid student email address is required.' },
        { status: 400 }
      );
    }

    await connectDB();

    let course: any = null;
    let isInternship = false;

    // 1. Try finding in Course model
    if (typeof courseId === 'string' && courseId.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(courseId).lean();
    }
    if (!course && typeof courseId === 'string') {
      course = await Course.findOne({
        $or: [{ slug: courseId.toLowerCase().trim() }, { title: new RegExp(`^${courseId}$`, 'i') }],
      }).lean();
    }

    // 2. Try finding in TrainingInternship model
    if (!course) {
      let prog: any = null;
      if (typeof courseId === 'string' && courseId.match(/^[0-9a-fA-F]{24}$/)) {
        prog = await TrainingInternship.findById(courseId).lean();
      }
      if (!prog && typeof courseId === 'string') {
        const cleanSlug = courseId.toLowerCase().trim();
        prog = await TrainingInternship.findOne({
          $or: [
            { slug: cleanSlug },
            { title: new RegExp(cleanSlug.replace(/[-_]/g, ' '), 'i') },
            { title: new RegExp(`^${cleanSlug}$`, 'i') },
          ],
        }).lean();
      }

      // If still not matched, check if search string relates to internship or training
      if (!prog && typeof courseId === 'string') {
        if (courseId.includes('internship') || courseId.includes('training')) {
          prog = await TrainingInternship.findOne({ status: { $ne: 'closed' } }).sort({ createdAt: -1 }).lean();
        }
      }

      if (prog) {
        isInternship = true;
        const trainingPrice =
          prog.trainingPrice !== undefined
            ? Number(prog.trainingPrice)
            : prog.price !== undefined
            ? Number(prog.price)
            : 2400;
        const originalPrice =
          prog.originalPrice !== undefined ? Number(prog.originalPrice) : 7999;

        course = {
          _id: prog._id.toString(),
          title: prog.title,
          slug: prog.slug,
          price: trainingPrice,
          originalPrice: originalPrice,
          thumbnail: prog.thumbnail || '',
          category: prog.domain || prog.track || 'Training & Internship',
        };
      }
    }

    // 3. Fallback to hardcoded Frontend Developer Training program if matching default
    if (!course) {
      if (
        courseId === 'frontend-developer-training-internship' ||
        courseId.includes('training') ||
        courseId.includes('internship')
      ) {
        isInternship = true;
        course = {
          _id: FRONTEND_INTERNSHIP_PROGRAM.slug,
          title: FRONTEND_INTERNSHIP_PROGRAM.title,
          slug: FRONTEND_INTERNSHIP_PROGRAM.slug,
          price: 2400,
          originalPrice: 7999,
          thumbnail: '',
          category: 'Web Development',
        };
      }
    }

    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Specified program or course was not found.' },
        { status: 404 }
      );
    }

    const originalPrice = Number(course.price || course.originalPrice || 2400);
    let discountAmount = 0;
    let appliedCoupon: any = null;

    // Validate Coupon if applied
    if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
      const cleanCoupon = couponCode.trim().toUpperCase();
      const couponResult = await validateAndApplyCoupon(
        cleanCoupon,
        originalPrice,
        isInternship ? 'training' : 'courses'
      );

      if (couponResult.valid) {
        discountAmount = couponResult.discountAmount;
        appliedCoupon = couponResult.coupon;

        // Increment usage count in database
        try {
          await Coupon.updateOne({ code: cleanCoupon }, { $inc: { usageCount: 1 } });
        } catch (e) {
          // ignore error
        }
      }
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    // If 100% discount coupon applied (finalPrice === 0), complete free enrollment without opening Razorpay
    if (finalPrice === 0) {
      const freeOrderId = `free_ord_${Date.now().toString().slice(-8)}_${Math.random().toString(36).slice(-4)}`;
      const freePaymentId = `free_pay_${appliedCoupon?.code || '100'}_${Date.now().toString().slice(-6)}`;

      const orderDoc = await Order.create({
        userId: userId || '',
        userEmail: userEmail.toLowerCase().trim(),
        userName: userName || 'Student',
        courseId: course._id.toString(),
        courseTitle: course.title,
        amount: 0,
        originalAmount: originalPrice,
        discountAmount: originalPrice,
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        currency: 'INR',
        razorpayOrderId: freeOrderId,
        razorpayPaymentId: freePaymentId,
        paymentMethod: 'coupon_free_discount',
        status: 'paid',
      });

      const enrollmentType = isInternship ? 'internship' : 'course';
      const batchName = isInternship
        ? 'Weekend Industrial Cohort 2026'
        : 'Cohort 2026 - Active';

      if (typeof course._id === 'string' && course._id.match(/^[0-9a-fA-F]{24}$/)) {
        await Course.findByIdAndUpdate(course._id, { $inc: { enrolledCount: 1 } });
      }

      await Enrollment.findOneAndUpdate(
        { userEmail: userEmail.toLowerCase().trim(), courseId: course._id.toString() },
        {
          $set: {
            userId: userId || '',
            userName: userName || 'Student',
            courseTitle: course.title,
            type: enrollmentType,
            batchName: batchName,
            enrolledAt: new Date(),
            orderId: freeOrderId,
            paymentId: freePaymentId,
            amountPaid: 0,
            status: 'active',
          },
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        success: true,
        isFree: true,
        orderId: freeOrderId,
        paymentId: freePaymentId,
        amount: 0,
        finalAmount: 0,
        originalAmount: originalPrice,
        discountAmount: originalPrice,
        appliedCoupon,
        currency: 'INR',
        dbOrderId: orderDoc._id.toString(),
        message: '100% discount coupon applied! Free enrollment activated successfully.',
        course: {
          id: course._id.toString(),
          slug: course.slug,
          title: course.title,
          price: course.price,
          thumbnail: course.thumbnail || '',
          category: course.category,
        },
      });
    }

    const amountInPaise = Math.round(finalPrice * 100);
    const receiptId = `rcpt_${Date.now().toString().slice(-8)}_${Math.random().toString(36).slice(-4)}`;
    const { key_id, key_secret } = getRazorpayKeys();

    let rzpOrder: any = null;

    // Direct, ultra-fast call to official Razorpay Orders REST API
    try {
      const authHeader = 'Basic ' + Buffer.from(`${key_id}:${key_secret}`).toString('base64');
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: receiptId,
          notes: {
            courseId: course._id.toString(),
            courseTitle: course.title,
            userEmail,
            couponCode: appliedCoupon ? appliedCoupon.code : '',
            originalPrice: originalPrice.toString(),
            discountAmount: discountAmount.toString(),
          },
        }),
      });

      if (rzpRes.ok) {
        rzpOrder = await rzpRes.json();
      } else {
        const errText = await rzpRes.text();
        console.warn('[Razorpay API direct error]:', errText);
      }
    } catch (rzpErr: any) {
      console.warn('[Razorpay Order Call Exception]:', rzpErr.message);
    }

    // Fallback order ID if Razorpay test or network warning
    if (!rzpOrder || !rzpOrder.id) {
      rzpOrder = {
        id: `order_${Date.now()}_${Math.random().toString(36).slice(-6)}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
      };
    }

    // Save Order in MongoDB
    const orderDoc = await Order.create({
      userId: userId || '',
      userEmail: userEmail.toLowerCase().trim(),
      userName: userName || 'Student',
      courseId: course._id.toString(),
      courseTitle: course.title,
      amount: finalPrice,
      originalAmount: originalPrice,
      discountAmount,
      couponCode: appliedCoupon ? appliedCoupon.code : '',
      currency: 'INR',
      razorpayOrderId: rzpOrder.id,
      status: 'created',
    });

    return NextResponse.json({
      success: true,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount, // in paise
      finalAmount: finalPrice,
      originalAmount: originalPrice,
      discountAmount,
      appliedCoupon,
      currency: rzpOrder.currency || 'INR',
      keyId: key_id,
      dbOrderId: orderDoc._id.toString(),
      course: {
        id: course._id.toString(),
        slug: course.slug,
        title: course.title,
        price: course.price,
        thumbnail: course.thumbnail || '',
        category: course.category,
      },
    });
  } catch (error: any) {
    console.error('[Create Order Route Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to initialize payment order' },
      { status: 500 }
    );
  }
}
