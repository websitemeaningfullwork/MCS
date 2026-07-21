**Homepage Update 01 — Hero Section Refinement & WhatsApp Floating Button**
===========================================================================

**Purpose**
-----------

This update refines the Homepage Hero Section by removing unnecessary UI elements and introducing a professional floating WhatsApp support button. The objective is to create a cleaner, more premium, and user-friendly landing experience while making customer support instantly accessible.

**1\. Remove the "Premium Mentorship for Bangladesh" Badge**
============================================================

### **Current State**

The current Hero Section displays a small badge above the main heading that says:

Premium Mentorship for Bangladesh

### **Required Change**

Completely remove this badge from the Hero Section.

### **Reason**

This badge creates unnecessary visual clutter and does not add meaningful value to the landing page.

Removing it allows:

*   Better visual balance
    
*   More focus on the main headline
    
*   Cleaner premium appearance
    
*   More breathing space in the Hero Section
    

After removing the badge, all remaining Hero content (headline, description, buttons, and image) should keep their current alignment.

No additional spacing should appear after removing the badge.

**2\. Add a Floating WhatsApp Support Button**
==============================================

A floating WhatsApp support button must be added to the website.

This button should remain visible throughout the entire website.

It should not be limited to the homepage only.

**Position**
------------

Desktop

*   Bottom Right Corner
    
*   Floating
    
*   Fixed Position
    
*   Approximately 24–32px away from the right edge
    
*   Approximately 24–32px away from the bottom edge
    

Mobile

*   Bottom Right Corner
    
*   Slightly smaller size
    
*   Fixed Position
    

The button must never overlap important page content.

**Design**
----------

The floating button should include:

*   Official WhatsApp Green color
    
*   Circular shape
    
*   Soft shadow
    
*   Premium hover animation
    
*   Smooth scaling animation on hover
    
*   Floating elevation effect
    
*   High quality WhatsApp icon
    

No surrounding border is required.

The design should feel similar to modern SaaS websites.

**Click Behaviour**
-------------------

When the visitor clicks the floating WhatsApp button:

### **Mobile Devices**

Open the WhatsApp mobile application directly.

If the app is unavailable, open WhatsApp Web automatically.

### **Desktop Devices**

Open WhatsApp Web in a new browser tab.

If supported by the operating system, allow the browser to launch the desktop WhatsApp application automatically.

**Message Behaviour**
---------------------

The conversation should automatically open using the configured WhatsApp destination.

An optional pre-filled message should also be supported.

Example:

Hello, I would like to know more about MCA.

This message should be configurable from the Admin Panel.

**3\. Admin Panel Control**
===========================

The WhatsApp floating button must be fully manageable from the Admin Panel.

No developer should be required to update WhatsApp information.

**Admin Settings**
------------------

Create a dedicated settings section.

Example:

Website Settings

→ WhatsApp Settings

The Admin Panel should support the following options:

### **Enable / Disable Button**

A simple toggle switch.

*   ON → Button visible
    
*   OFF → Button hidden
    

### **Connection Type**

Allow the administrator to choose:

*   WhatsApp Number
    
*   WhatsApp Link
    

Only one option should be active at a time.

### **WhatsApp Number**

Editable text field.

Example:

+8801712345678

### **WhatsApp Link**

Editable URL field.

Example:

[https://wa.me/8801712345678](https://wa.me/8801712345678)

or

[https://chat.whatsapp.com/](https://chat.whatsapp.com/)...

### **Default Message**

Textarea field.

Example:

Hello! I want to know more about MCA.

This message should automatically appear when a user opens the conversation.

### **Button Position**

Dropdown

Options:

*   Bottom Right (Default)
    
*   Bottom Left
    

### **Button Size**

Dropdown

Small

Medium

Large

### **Show Animation**

Toggle

Enable or disable the floating animation.

### **Save Changes**

After saving:

The updated WhatsApp information should immediately become active on the live website.

No redeployment should be required.

**4\. Technical Requirements**
==============================

The floating button must:

*   Load on every page
    
*   Be globally reusable
    
*   Use a single configuration source
    
*   Read all values dynamically from the Admin Panel
    
*   Update instantly after saving settings
    
*   Never require hardcoded phone numbers or links
    

**5\. Important Requirements**
==============================

The following items are mandatory:

*   Remove the "Premium Mentorship for Bangladesh" badge completely.
    
*   Keep the existing Hero layout unchanged.
    
*   Add a floating WhatsApp button.
    
*   Display the button on every page.
    
*   Open WhatsApp correctly on both mobile and desktop devices.
    
*   Allow the administrator to manage the WhatsApp number, link, default message, visibility, position, size, and animation entirely from the Admin Panel.
    
*   No code changes should be required when WhatsApp information changes.
    

**Course Management System (Program Editor) – Complete Redesign**
=================================================================

**Purpose**
-----------

The current Program Management system is too basic and does not provide sufficient control for creating and managing premium educational programs.

This module must be completely redesigned into a full-featured Course Management System where administrators can create, edit, organize, publish, and manage every aspect of a program without writing code.

This will become one of the core modules of the MCA platform.

**Overall Workflow**
====================

The system should follow the complete learning workflow below.

Create Program

↓

Program Information

↓

Assign Mentor(s)

↓

Create Seasons

↓

Create Classes

↓

Upload YouTube Lesson

↓

Add Lesson Overview

↓

Add Resources

↓

Add Quiz (Q&A)

↓

Add Notes

↓

Publish Program

↓

Student Purchases Course

↓

Student Watches Lesson

↓

Student Completes Lesson

↓

Student Gives Review

↓

Admin Manages Reviews

Every part of this workflow must be manageable from the Admin Panel.

**1\. Program Information Section**
===================================

When creating or editing a program, the administrator should be able to manage all program information from one page.

### **Required Fields**

Program Thumbnail

*   Upload image
    
*   Replace image
    
*   Remove image
    
*   Preview image
    

Program Title

Short Subtitle

Program Description

Category

Difficulty Level

Examples:

*   Beginner
    
*   Intermediate
    
*   Advanced
    
*   Beginner to Advanced
    

Program Status

*   Draft
    
*   Published
    
*   Hidden
    

Featured Program

ON / OFF

Program Price

Discount Price

Course Trailer (YouTube Link)

The trailer should appear on the program details page before purchase.

**2\. Mentor Assignment**
=========================

Each program can have one or multiple mentors.

Administrator should be able to

*   Add Mentor
    
*   Remove Mentor
    
*   Change Mentor
    
*   Select Primary Mentor
    

Each mentor should display

Profile Photo

Full Name

Designation

Short Bio

Session Price (if applicable)

Availability

**3\. Seasons Management**
==========================

Programs should not consist of only lessons.

Programs must first be divided into Seasons.

Example

Season 1

Foundation

Season 2

Preparation

Season 3

Practice

Season 4

Advanced

Administrator should be able to

Add Season

Edit Season

Delete Season

Reorder Seasons

Collapse / Expand Seasons

Each season can contain unlimited lessons.

**4\. Lesson Management**
=========================

Each Season contains multiple lessons.

Administrator should be able to

Create Lesson

Rename Lesson

Duplicate Lesson

Delete Lesson

Reorder Lessons

Drag & Drop Lessons

Unlimited Lessons

Each Lesson should contain its own independent content.

**5\. Lesson Basic Information**
================================

Every lesson should contain

Lesson Title

Lesson Thumbnail

Upload Thumbnail

Replace Thumbnail

Remove Thumbnail

Lesson Duration (Optional)

Lesson Status

Published

Draft

Hidden

**6\. YouTube Video Integration**
=================================

Each lesson should contain a YouTube Video Link.

Supported

Public Video

Unlisted Video

When the administrator pastes a YouTube link

The system should automatically embed the video.

Students should never leave the MCA website.

Videos should play directly inside the lesson page.

Only administrators can change the video.

**7\. Lesson Overview**
=======================

Each lesson should have its own Overview.

Administrator should be able to edit using a Rich Text Editor.

Supported formatting

Heading

Bold

Italic

Underline

Bullet List

Number List

Links

Highlight

Paragraphs

Images (Optional)

This section appears under the Overview tab.

**8\. Resources**
=================

Each lesson should have independent resources.

Administrator should be able to add

PDF

DOCX

PPT

ZIP

External Link

Google Drive Link

Practice File

Worksheet

Resource Title

Resource Type

Upload File

Delete File

Replace File

Unlimited resources per lesson.

Displayed inside the Resources tab.

**9\. Quiz (Q&A)**
==================

Every lesson should support quizzes.

Administrator should be able to

Add Question

Edit Question

Delete Question

Unlimited Questions

Question Types

Multiple Choice

True / False

Short Answer (Future Support)

Each question should include

Question

Options

Correct Answer

Explanation (Optional)

Students complete the quiz after finishing the lesson.

Quiz appears inside the Q&A tab.

**10\. Notes**
==============

Each lesson should support Notes.

Administrator can write

Important Instructions

Homework

Assignments

Reminder

Additional Information

Displayed inside the Notes tab.

**11\. Student Course Player**
==============================

After purchasing a course, students should see a premium learning interface.

Layout

Left Sidebar

Course Content

Seasons

Lessons

Lesson Progress

Completed Lessons

Current Lesson

Main Content

Embedded YouTube Player

Previous Lesson

Next Lesson

Below the player

Overview

Resources

Q&A

Notes

Reviews

This layout should remain consistent throughout the course.

**12\. Lesson Completion**
==========================

When a student finishes watching a lesson,

The lesson can be marked as Completed.

Completed lessons should display a green checkmark.

Progress updates automatically.

**13\. Review System**
======================

Students should never be forced to leave a review.

Reviews are optional.

However, the review option should become available only after meaningful completion.

**Lesson Review**
-----------------

Unlocked only after completing the lesson.

Student can

Rate using 1–5 stars

Write an optional review

Submit Review

**Season Review**
-----------------

Unlocked after completing every lesson in that Season.

Student can rate

The entire season

Leave optional feedback

**Course Review**
-----------------

Unlocked after completing the entire course.

Student can

Rate the complete program

Write detailed feedback

Submit review

**14\. Reviews Display**
========================

Approved reviews should automatically appear

Program Details Page

Lesson Reviews Tab

Homepage Testimonials Section

Student Dashboard → My Reviews

Only approved reviews should be publicly visible.

**15\. Admin Review Management**
================================

Administrator should have a dedicated Reviews module.

Functions

View Reviews

Filter by Program

Filter by Lesson

Filter by Rating

Filter by Status

Search Reviews

Approve Review

Hide Review

Delete Review

Reply (Future)

Export Reviews

Review Status

Pending

Approved

Hidden

Reported

**16\. Student Dashboard**
==========================

Students should have a My Reviews section.

Students can

View Reviews

Edit Reviews

Delete Reviews

See Review Status

Pending

Approved

Hidden

**17\. Program Editing Experience**
===================================

Everything related to a program should be editable from one centralized interface.

Without leaving the page, the administrator should be able to manage

Program Information

Mentors

Seasons

Lessons

Lesson Order

Lesson Videos

Overview

Resources

Quiz

Notes

Program Status

Program Thumbnail

Everything should be accessible from one workspace.

**18\. User Experience Requirements**
=====================================

The entire editing experience should feel similar to a modern Learning Management System (LMS).

Design Goals

*   Clean
    
*   Premium
    
*   Minimal
    
*   Fast
    
*   Organized
    
*   Easy to understand
    
*   No unnecessary clicks
    
*   Everything logically grouped
    
*   Responsive on desktop and tablet
    
*   Consistent with MCA's Cream White Theme
    

**Final Requirement**
=====================

This Program Management module is the heart of the MCA platform. The developer must build it as a complete Learning Management System (LMS), not as a simple CRUD page. Every program, season, lesson, YouTube video, overview, resource, quiz, notes, review, and mentor assignment must be fully manageable from the Admin Panel. The final implementation should closely match the provided UI references while maintaining a clean, premium, scalable, and production-ready architecture suitable for future expansion without major redesign.

**Admin Panel – Mentor Management System (Complete Redesign)**
==============================================================

**Purpose**
-----------

The current Mentor Management module is too limited and only allows basic mentor information such as name, headline, bio, and skills.

The Mentor Management system must be completely redesigned into a comprehensive administration module where administrators can create, edit, organize, manage, and control every aspect of a mentor profile from a single page.

This module will serve as the central management interface for all mentors on the MCA platform.

Create Mentor

↓

Upload Profile Photo

↓

Basic Information

↓

Contact Information

↓

Visibility Settings

↓

Expertise & Skills

↓

Professional Information

↓

Availability Schedule

↓

Session Pricing

↓

Social Links

↓

Mentor Status

↓

Save Mentor

↓

Mentor appears on Website

↓

Mentor becomes available for Appointment Booking

↓

Mentor can be assigned to Programs

Every step must be fully manageable from the Admin Panel.

**1\. Profile Picture Management**
==================================

Each mentor must have a professional profile image.

Administrator should be able to:

*   Upload Profile Picture
    
*   Replace Profile Picture
    
*   Remove Profile Picture
    
*   Crop Image (optional)
    
*   Preview Image before saving
    

Supported formats

*   JPG
    
*   PNG
    
*   WEBP
    

Maximum size should be configurable.

The uploaded image will automatically appear on:

*   Mentor Listing Page
    
*   Mentor Details Page
    
*   Appointment System
    
*   Program Details
    
*   Assigned Courses
    
*   Student Dashboard
    

**2\. Basic Information**
=========================

Each mentor profile must contain the following required fields.

### **Required Fields**

Full Name

Professional Title / Headline

Examples

*   Career Coach
    
*   Admission Mentor
    
*   Life Coach
    
*   Academic Mentor
    
*   Business Consultant
    

Short Bio

A short introduction describing the mentor's expertise.

Maximum characters can be configurable.

**3\. Contact Information**
===========================

Administrator should be able to manage all mentor contact details.

Fields

Active Phone Number

WhatsApp Number

Email Address (Optional)

These fields are stored internally for communication.

**4\. Contact Visibility Settings**
===================================

The administrator must be able to decide which contact information is visible to students.

Visibility toggles

Show Phone Number

ON / OFF

Show WhatsApp Number

ON / OFF

Show Email Address

ON / OFF

If visibility is disabled, the information remains stored in the database but is hidden from students.

This allows administrators to protect mentor privacy while still keeping internal records.

**5\. Expertise**
=================

Each mentor may have multiple areas of expertise.

Examples

*   Career Guidance
    
*   University Admission
    
*   Study Planning
    
*   Personal Development
    
*   Scholarship Guidance
    
*   Mental Wellness
    
*   Productivity
    

Administrator should be able to

Add Expertise

Remove Expertise

Edit Expertise

Unlimited Expertise Tags

Input should support tag-based entry.

**6\. Skills**
==============

Mentors should also have a dedicated Skills section.

Examples

*   Career Planning
    
*   Decision Making
    
*   Communication
    
*   Leadership
    
*   Problem Solving
    
*   Motivation
    
*   Time Management
    
*   Mentorship
    

Multiple skills should be supported using tag input.

**7\. Professional Information**
================================

Each mentor profile should include professional credentials.

Fields

Years of Experience

Highest Qualification

Examples

*   BSc
    
*   MSc
    
*   PhD
    
*   MBBS
    

Current Position

Examples

Founder & Mentor

Professor

Career Coach

Senior Consultant

Organization (Optional)

Certificates (Future Support)

**8\. Availability Management**
===============================

Administrators should be able to define when the mentor is available for appointments.

Working Days

Monday

Tuesday

Wednesday

Thursday

Friday

Saturday

Sunday

Working Hours

Start Time

End Time

Break Time (Optional)

Multiple Break Times should be supported.

Example

1:00 PM – 2:00 PM

The appointment booking system will automatically use these settings.

**9\. Appointment Configuration**
=================================

Each mentor should have configurable appointment settings.

Fields

Session Duration

Example

Up to 2 Hours

Session Price (BDT)

Currency

Booking Availability

Active / Disabled

This information should automatically integrate with the Appointment Booking System.

When a student selects a mentor, the mentor's configured price and availability should automatically be used.

**10\. Social Links**
=====================

Administrators should be able to add mentor social media links.

Supported

Facebook Page

YouTube Channel

LinkedIn (Optional)

Personal Website (Future Support)

Instagram (Future Support)

These links should be displayed only where appropriate on the public mentor profile.

**11\. Mentor Status**
======================

Administrator should be able to control mentor visibility.

Settings

Featured Mentor

Verified Mentor

Active Mentor

Inactive Mentor

Display Order

Lower number appears first.

Status

Active

Inactive

Hidden

Draft

**12\. Mentor Assignment**
==========================

The mentor should be assignable to one or multiple programs.

Administrator should be able to

Assign Mentor to Program

Remove Mentor

Change Primary Mentor

Assign Multiple Programs

The relationship between Programs and Mentors should be dynamic.

**13\. Integration with Appointment System**
============================================

This Mentor Management module must integrate directly with the Appointment Booking System.

When a student books an appointment,

the system should automatically retrieve

*   Mentor Name
    
*   Mentor Photo
    
*   Session Price
    
*   Working Days
    
*   Available Time Slots
    
*   Session Duration
    

No duplicate configuration should be required.

Everything should come directly from this Mentor Profile.

**14\. Integration with Website**
=================================

Changes made in the Admin Panel should immediately reflect throughout the platform.

Updated information should automatically appear on:

*   Mentor Listing Page
    
*   Mentor Details Page
    
*   Program Pages
    
*   Appointment Booking
    
*   Student Dashboard
    
*   Search Results
    
*   Homepage Featured Mentors (if enabled)
    

**15\. User Experience Requirements**
=====================================

The Mentor Management interface should feel modern, premium, and highly organized.

Design Goals

*   Clean Layout
    
*   Premium UI
    
*   Cream White Theme
    
*   Fully Responsive
    
*   Logical Section Grouping
    
*   Minimal Clicks
    
*   Easy to Manage
    
*   Production Ready
    
*   Scalable for Future Features
    

**16\. Future Scalability**
===========================

The architecture should be designed so that future features can be added without redesigning the module.

Examples

*   Mentor Documents
    
*   Identity Verification
    
*   Calendar Synchronization
    
*   Zoom / Google Meet Integration
    
*   Multiple Session Types
    
*   Mentor Analytics
    
*   Revenue Reports
    
*   Student Feedback Analytics
    
*   Mentor Performance Dashboard
    

**Final Requirement**
=====================

The Mentor Management module should not function as a simple form editor. It must operate as a complete mentor administration system that centralizes all mentor-related information, including profile management, contact information, visibility controls, expertise, professional details, availability, appointment settings, social links, and platform status. All changes must be manageable from a single, well-organized interface and should automatically synchronize across the website, appointment booking system, program pages, and student-facing areas. The final implementation should closely match the approved UI design while maintaining a clean, premium, scalable, and production-ready architecture that supports future expansion without requiring major redesign.

**Appointment Booking System (Complete Integration & Admin Management)**
========================================================================

**Purpose**
-----------

The MCA platform currently does not include an Appointment Booking System. A complete end-to-end appointment module must be added to the website and fully integrated with the existing student platform, mentor system, payment workflow, notifications, and admin panel.

This feature will allow students to book one-on-one mentoring sessions while providing administrators with complete control over appointment types, mentor schedules, availability, payments, notifications, and booking management.

The final implementation should closely follow the approved UI design while remaining scalable, responsive, and production-ready.

**Website Navigation Integration**
==================================

A new **"Appointments"** menu item must be added to the main website navigation.

Navigation order:

*   Home
    
*   Programs
    
*   Mentors
    
*   E-books
    
*   Live Classes
    
*   **Appointments (New)**
    

Clicking this menu should open the Appointment Booking System.

**Multi-Step Appointment Wizard**
=================================

The booking process must be separated into **five independent pages**. Each step should display only the relevant content for that stage.

The progress indicator must remain visible at the top throughout the entire booking flow.

Progress Steps:

1.  Choose Type
    
2.  Date & Time
    
3.  Your Details
    
4.  Select Mentor
    
5.  Review & Pay
    

Each page must contain **Back** and **Next** buttons (except the first and final confirmation pages).

**Step 1 – Choose Appointment Type**
====================================

The first page allows the student to select what they want to discuss.

Appointment Types include:

*   Career Guidance
    
*   Study Planning
    
*   University Admission
    
*   Job & Career Life
    
*   Depression & Life Support
    
*   Interview Preparation
    
*   Own Topic
    

Each appointment type should include:

*   Icon
    
*   Title
    
*   Short Description
    

Students may also select **Own Topic** to discuss any custom subject.

**Step 2 – Select Date & Time**
===============================

Students select an available appointment date and time.

The page must include:

*   Monthly Calendar
    
*   Available Dates
    
*   Available Time Slots
    
*   Selected Slot Highlight
    
*   Time Zone Display
    

Slot Legend:

*   Available
    
*   Selected
    
*   Booked
    
*   Unavailable
    

These indicators must be clearly distinguishable using color while maintaining a clean and premium design.

Time slots should be generated automatically based on the mentor's configured availability from the Admin Panel.

**Step 3 – Student Details**
============================

Students must complete their booking information.

Required Fields:

*   Full Name
    
*   Active Phone Number
    
*   WhatsApp Number
    
*   Gender
    
*   Age
    
*   Occupation
    
*   Short Description (Optional)
    

Email address is **not required**, because the user is already authenticated.

**Step 4 – Select Mentor**
==========================

Students choose which mentor they want to book.

Each mentor card should display:

*   Profile Photo
    
*   Mentor Name
    
*   Professional Title
    
*   Average Rating
    
*   Number of Reviews
    
*   Session Price
    
*   Session Duration (Up to 2 Hours)
    
*   Verification Badge (if enabled)
    

Only mentors available for the selected date and time should appear.

Mentor pricing should automatically come from the Mentor Management module.

**Step 5 – Review & Payment**
=============================

Before payment, students should see a complete booking summary.

Summary includes:

*   Appointment Type
    
*   Selected Date
    
*   Selected Time
    
*   Mentor
    
*   Session Duration
    
*   Platform (Google Meet or configured platform)
    
*   Total Amount
    

Students may return to previous steps if they wish to modify any information.

Clicking **Review & Pay** proceeds to the configured payment system.

**Payment Integration**
=======================

The booking module must integrate with the platform's payment system.

Supported payment methods should be configurable from the Admin Panel.

Examples:

*   bKash
    
*   Nagad
    
*   Rocket
    
*   SSLCommerz
    
*   Manual Payment
    
*   Future Payment Gateways
    

Appointments should not be confirmed until payment is successfully completed (unless manual approval is enabled).

**Appointment Confirmation**
============================

After successful payment:

The system should automatically:

*   Generate Appointment
    
*   Reserve the selected time slot
    
*   Notify the mentor
    
*   Notify the student
    
*   Save the booking in the database
    

A confirmation page should display:

*   Booking Successful
    
*   Appointment ID
    
*   Date & Time
    
*   Mentor
    
*   Meeting Platform
    
*   Payment Status
    

**Student Dashboard Integration**
=================================

Students should have a dedicated **My Appointments** section.

Students can:

*   View Upcoming Appointments
    
*   View Completed Appointments
    
*   View Cancelled Appointments
    
*   Reschedule (if permitted)
    
*   Cancel (if permitted)
    
*   Join Meeting
    
*   View Payment Status
    

**Admin Dashboard Overview**
============================

The Admin Dashboard should include real-time appointment analytics.

Dashboard Cards:

*   Total Appointments
    
*   Today's Appointments
    
*   Pending Confirmations
    
*   Monthly Revenue
    
*   Upcoming Sessions
    
*   Cancelled Appointments
    

All values should update automatically.

**Appointment Management**
==========================

Administrators must have complete control over every booking.

Functions include:

*   View All Appointments
    
*   Search
    
*   Filter
    
*   Edit
    
*   Cancel
    
*   Reschedule
    
*   Change Mentor
    
*   Update Payment Status
    
*   Change Booking Status
    
*   Delete Appointment
    

**Calendar View**
=================

The Admin Panel must include a calendar interface showing:

*   Daily Schedule
    
*   Weekly Schedule
    
*   Monthly Schedule
    
*   Mentor Availability
    
*   Booked Slots
    
*   Break Times
    

This allows administrators to quickly understand mentor availability.

**Mentor Schedule Management**
==============================

Administrators should manage mentor schedules directly from the Admin Panel.

Configurable options include:

*   Working Days
    
*   Working Hours
    
*   Break Time
    
*   Holidays
    
*   Temporary Unavailable Dates
    
*   Maximum Appointments Per Day
    

The Appointment System must automatically follow these rules.

**Appointment Types Management**
================================

Administrators must be able to create unlimited appointment categories.

Each appointment type should support:

*   Name
    
*   Description
    
*   Icon
    
*   Default Price
    
*   Default Session Duration
    
*   Status (Active / Inactive)
    

All appointment types should immediately appear in the booking page.

**Notification System**
=======================

Every important appointment event should generate notifications.

Notify Student:

*   Booking Successful
    
*   Payment Successful
    
*   Appointment Reminder
    
*   Mentor Changed
    
*   Schedule Changed
    
*   Appointment Cancelled
    

Notify Mentor:

*   New Appointment
    
*   Payment Received
    
*   Appointment Cancelled
    
*   Student Rescheduled
    

Notify Admin:

*   New Booking
    
*   Payment Received
    
*   Failed Payment
    
*   Appointment Cancellation
    

Notifications should appear both inside the Admin Dashboard and optionally via email or WhatsApp if enabled.

**Appointment Status**
======================

Supported booking statuses:

*   Pending
    
*   Confirmed
    
*   Completed
    
*   Cancelled
    
*   Rescheduled
    
*   No Show
    

Administrators should be able to update these statuses at any time.

**Appointment Reports**
=======================

Generate reports based on:

*   Date Range
    
*   Mentor
    
*   Appointment Type
    
*   Revenue
    
*   Booking Status
    
*   Payment Status
    

Reports should be exportable in the future (CSV/PDF-ready architecture).

**UI & UX Requirements**
========================

The Appointment module should follow the same premium design language as the rest of the MCA platform.

Requirements:

*   Cream White Theme
    
*   Fully Responsive
    
*   Multi-Step Wizard
    
*   Clear Progress Indicator
    
*   Smooth Transitions
    
*   Modern Cards
    
*   Rounded Components
    
*   Consistent Color System
    
*   Accessible Form Design
    
*   Clean Typography
    
*   Minimal Visual Clutter
    

The user should always know which step they are on, what has been completed, and what remains.

**Future Scalability**
======================

The system architecture should support future enhancements without redesign.

Examples:

*   Zoom Integration
    
*   Google Meet API Integration
    
*   Microsoft Teams
    
*   Automatic Meeting Link Generation
    
*   Coupon Codes
    
*   Group Appointments
    
*   Multiple Time Zones
    
*   Recurring Sessions
    
*   Waiting List
    
*   Reminder Automation
    
*   AI Scheduling Assistant
    

**Final Requirement**
=====================

The Appointment Booking System should be implemented as a complete, production-ready workflow rather than a simple booking form. It must provide a seamless five-step booking experience, integrate directly with Mentor Management, Payments, Notifications, Student Dashboard, and the Admin Panel, and allow administrators to manage every aspect of appointments from a single centralized interface. All scheduling, pricing, mentor availability, booking status, notifications, and payment information should remain synchronized across the entire platform. The final implementation should closely match the approved UI reference, emphasizing clarity, ease of use, premium visual quality, scalability, and long-term maintainability.