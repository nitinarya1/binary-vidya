import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db';
import { Lead } from '../../../../lib/models';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      name,
      phone,
      email,
      course,
      interest,
      preferredDomain,
      collegeName,
      education,
      branch,
      year,
      source,
    } = body;

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    const cleanEmail = email?.trim().toLowerCase() || undefined;
    const cleanName = name?.trim() || 'Prospective Learner';
    const selectedDomain = (preferredDomain || interest || course || '').trim();
    const cleanCollege = collegeName?.trim() || '';
    const cleanEducation = education?.trim() || '';
    const cleanBranch = branch?.trim() || '';
    const cleanYear = year?.trim() || '';
    const leadSource = source || 'counselling_page';

    // Find if lead with this phone already exists
    const existing = await Lead.findOne({
      phone: { $regex: new RegExp(cleanPhone.slice(-10) + '$') },
    });

    if (existing) {
      if (cleanEmail && !existing.email) existing.email = cleanEmail;
      if (cleanName && (!existing.name || existing.name === 'Prospective Learner' || existing.name === 'Not Provided')) {
        existing.name = cleanName;
      }
      if (selectedDomain) {
        existing.course = selectedDomain;
        (existing as any).preferredDomain = selectedDomain;
      }
      if (cleanCollege) (existing as any).collegeName = cleanCollege;
      if (cleanEducation) (existing as any).education = cleanEducation;
      if (cleanBranch) (existing as any).branch = cleanBranch;
      if (cleanYear) (existing as any).year = cleanYear;

      await existing.save();

      return NextResponse.json({
        success: true,
        message: 'Thank you! Your counselling request has been recorded. Our senior counsellor will call you shortly.',
      });
    }

    // Create new lead
    await Lead.create({
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      course: selectedDomain,
      preferredDomain: selectedDomain,
      collegeName: cleanCollege,
      education: cleanEducation,
      branch: cleanBranch,
      year: cleanYear,
      source: leadSource,
      status: 'new',
      statusUpdatedByName: 'Counselling Page',
      statusUpdatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your career counselling request has been booked successfully. Our mentor will reach out within 24 hours.',
    });
  } catch (err: any) {
    console.error('[Public Lead Capture Error]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Submission failed. Please try again.' },
      { status: 500 }
    );
  }
}
