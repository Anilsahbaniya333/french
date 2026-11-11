/**
 * Site-wide content (methodology, why choose us, FAQ, etc.)
 * Edit this file to update homepage content without touching JSX.
 */

export const SITE_CONFIG = {
  name: "Mappell Academy",
  tagline: "French · Future · Freedom",
};

export const WHY_CHOOSE_US = [
  {
    title: "Structured A1 → B2 Path",
    description: "A clear, CEFR-aligned progression from absolute beginner to upper-intermediate. Every lesson has a purpose.",
    icon: "book",
  },
  {
    title: "Expert French Teachers",
    description: "Learn from fluent and native speakers with real classroom experience and a genuine passion for teaching.",
    icon: "teacher",
  },
  {
    title: "Recordings + Flexible Access",
    description: "All live classes are recorded. Missed a session? Watch it back any time from your student portal.",
    icon: "calendar",
  },
  {
    title: "Assignments with Feedback",
    description: "Practice through structured tasks and get personal tutor feedback on every submission.",
    icon: "materials",
  },
];

export const FAQ_ITEMS = [
  {
    question: "Can I start learning French with no previous experience?",
    answer:
      "Yes. All three of our packages start from zero — the A1 Foundation course begins with the French alphabet and pronunciation, and is designed for students with absolutely no prior French knowledge.",
  },
  {
    question: "How long does it take to complete A1?",
    answer:
      "The A1 French Foundation course runs for up to 3 months. This is an estimated timeline — individual progress depends on your participation, practice, and learning pace.",
  },
  {
    question: "What is included in the CAD $1,000 full course?",
    answer:
      "The Complete French Program covers the full A1, A2, B1, and B2 curriculum, plus TCF / TEF Canada exam preparation. It includes live classes with recordings, weekly mini exams with personalized feedback, speaking, listening, reading, and writing practice, and access to your personal student learning portal. The price is for the complete package, not a monthly fee.",
  },
  {
    question: "Are classes recorded?",
    answer:
      "Yes. Live classes are recorded and made available in your student portal so you can review lessons, reinforce what you learned, and catch up if you miss a session.",
  },
  {
    question: "Will I receive weekly feedback?",
    answer:
      "Yes. Every week you complete a mini assessment, and your teacher provides personalized feedback highlighting your strengths, weaknesses, and the areas you should focus on next.",
  },
  {
    question: "Can I access learning materials online?",
    answer:
      "Yes. Registered students get access to a personal learning portal with class recordings, course materials and PDF notes, assignments, teacher feedback, and progress tracking.",
  },
  {
    question: "Does the full program include TCF/TEF exam preparation?",
    answer:
      "Yes. The Complete French Program (A1 to B2) includes structured TCF Canada and TEF Canada exam preparation leading up to your exam. We do not guarantee a specific score, NCLC level, or immigration outcome — results depend on each student's effort and pace.",
  },
  {
    question: "How can I register?",
    answer:
      "Click Register Now, choose your course and enter your details. Pay the course fee by Interac e-Transfer to frenchclass357@gmail.com and upload your payment confirmation screenshot. Our admissions team verifies your payment, confirms your enrollment, and emails you a secure link to set up your Student Portal login. Questions before paying? Email frenchclass357@gmail.com.",
  },
];

export const METHODOLOGY_PREVIEW = {
  title: "Our Methodology",
  description:
    "We use a communicative approach — learn by doing. You'll speak French from day one, with grammar and vocabulary taught in context. Our lessons blend live instruction with self-paced practice.",
  highlights: [
    "Communicative method",
    "Real class recordings",
    "Practice-based learning",
    "Tutor feedback",
  ],
};

/** Admissions phone / WhatsApp numbers (shown in the top bar, footer and contact blocks). */
export const CONTACT_PHONES = [
  { label: "Canada", display: "+1 437 559 4324", tel: "+14375594324", whatsapp: "https://wa.me/14375594324" },
  { label: "Nepal", display: "+977 981-5713726", tel: "+9779815713726", whatsapp: "https://wa.me/9779815713726" },
] as const;
