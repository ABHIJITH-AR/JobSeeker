/* eslint-disable no-console */
require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const EmployerProfile = require('../models/EmployerProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');

const WITH_DEMO = process.argv.includes('--with-demo');

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

async function ensureUser({ name, email, phone, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    if (role && existing.role !== role) {
      existing.role = role;
      await existing.save({ validateBeforeSave: false });
      console.log(`Updated role to ${role}: ${email}`);
    } else {
      console.log(`User already exists: ${email} (${existing.role})`);
    }
    return existing;
  }
  const user = await User.create({ name, email, phone, password, role });
  console.log(`Created ${user.role}: ${email}`);
  return user;
}

async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@jobseeker.in').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe@12345';
  const name = process.env.ADMIN_NAME || 'Site Administrator';
  const phone = process.env.ADMIN_PHONE || '9999999999';

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      existing.isActive = true;
      await existing.save({ validateBeforeSave: false });
      console.log(`Promoted existing user ${email} to admin.`);
    } else {
      console.log(`Admin already exists: ${email}`);
    }
    return existing;
  }

  const admin = await User.create({ name, email, phone, password, role: 'admin', isActive: true });
  console.log('----------------------------------------------------');
  console.log(' Admin account created');
  console.log(` Email:    ${email}`);
  console.log(' Password: (ADMIN_PASSWORD from server/.env)');
  console.log(' Change this password after first login.');
  console.log('----------------------------------------------------');
  return admin;
}

const DEMO_EMPLOYERS = [
  {
    name: 'Rahul Menon',
    email: 'demo.employer@jobseeker.in',
    phone: '9876500001',
    password: 'Demo@12345',
    companyName: 'TechNova Solutions',
    companyEmail: 'careers@technova.example',
    website: 'https://technova.example',
    industry: 'Information Technology',
    companySize: '201-500 employees',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    address: 'Outer Ring Road, Bengaluru',
    description:
      'TechNova Solutions builds cloud products and data platforms for enterprises. We are a product-first team focused on engineering excellence and employee growth.',
    isVerified: true,
  },
  {
    name: 'Priya Sharma',
    email: 'hr.bharatinfotech@jobseeker.in',
    phone: '9876500002',
    password: 'Demo@12345',
    companyName: 'Bharat Infotech',
    companyEmail: 'jobs@bharatinfotech.example',
    website: 'https://bharatinfotech.example',
    industry: 'IT Services',
    companySize: '501-1000 employees',
    state: 'Maharashtra',
    district: 'Pune',
    city: 'Pune',
    address: 'Hinjawadi IT Park, Pune',
    description:
      'Bharat Infotech delivers digital transformation, ERP and staffing solutions to clients across India and overseas.',
    isVerified: true,
  },
  {
    name: 'Arjun Nair',
    email: 'talent@keralacare.example',
    phone: '9876500003',
    password: 'Demo@12345',
    companyName: 'KeralaCare Health',
    companyEmail: 'hr@keralacare.example',
    website: 'https://keralacare.example',
    industry: 'Healthcare',
    companySize: '51-200 employees',
    state: 'Kerala',
    district: 'Ernakulam',
    city: 'Kochi',
    address: 'Infopark, Kochi',
    description:
      'KeralaCare Health operates multi-speciality clinics and diagnostic centres across Kerala with a patient-first approach.',
    isVerified: false,
  },
];

const DEMO_JOBS = [
  {
    employerEmail: 'demo.employer@jobseeker.in',
    title: 'Full Stack Developer (MERN)',
    category: 'IT and Software Development',
    description:
      'We are looking for a Full Stack Developer with strong React and Node.js skills to build scalable customer-facing products. You will work with designers, product managers and senior engineers in an agile team.',
    responsibilities: [
      'Build and maintain React front-end applications',
      'Design REST APIs with Node.js and Express',
      'Write clean, testable code and participate in code reviews',
      'Collaborate with product and design teams',
    ],
    skills: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'JavaScript', 'REST API'],
    qualification: 'B.E / B.Tech',
    experience: '1-3 Years',
    experienceMin: 1,
    salaryMin: 45000,
    salaryMax: 75000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'Hybrid',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    vacancies: 4,
    postedDaysAgo: 2,
    deadlineDays: 28,
  },
  {
    employerEmail: 'demo.employer@jobseeker.in',
    title: 'Data Analyst',
    category: 'Data Science',
    description:
      'Join our analytics team to turn product and business data into actionable insights. You will build dashboards, run experiments and partner with business teams.',
    responsibilities: ['Build dashboards in Power BI / Tableau', 'Write SQL queries for analysis', 'Present insights to stakeholders'],
    skills: ['SQL', 'Python', 'Power BI', 'Excel', 'Statistics'],
    qualification: 'Any Degree',
    experience: '0-1 Years',
    experienceMin: 0,
    salaryMin: 35000,
    salaryMax: 55000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    vacancies: 2,
    postedDaysAgo: 4,
    deadlineDays: 21,
  },
  {
    employerEmail: 'demo.employer@jobseeker.in',
    title: 'Frontend Developer Intern',
    category: 'Internship',
    description:
      'A six month paid internship for final year students and fresh graduates who want hands-on experience building modern web interfaces with React and Tailwind CSS.',
    responsibilities: ['Convert designs into responsive UI', 'Fix UI bugs', 'Learn and contribute to the component library'],
    skills: ['HTML', 'CSS', 'JavaScript', 'React.js', 'Tailwind CSS'],
    qualification: 'Bachelor Degree',
    experience: 'Fresher',
    experienceMin: 0,
    salaryMin: 15000,
    salaryMax: 20000,
    salaryPeriod: 'month',
    jobType: 'Internship',
    workMode: 'Remote',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    vacancies: 5,
    postedDaysAgo: 1,
    deadlineDays: 30,
  },
  {
    employerEmail: 'hr.bharatinfotech@jobseeker.in',
    title: 'Java Backend Engineer',
    category: 'Engineering',
    description:
      'Design and build enterprise-grade backend services using Java, Spring Boot and microservices. Work closely with client teams on large digital transformation programmes.',
    responsibilities: ['Develop Spring Boot microservices', 'Integrate with SQL and NoSQL databases', 'Ensure API security and performance'],
    skills: ['Java', 'Spring Boot', 'Microservices', 'SQL', 'REST API'],
    qualification: 'B.E / B.Tech',
    experience: '3-5 Years',
    experienceMin: 3,
    salaryMin: 80000,
    salaryMax: 130000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'Hybrid',
    state: 'Maharashtra',
    district: 'Pune',
    city: 'Pune',
    vacancies: 6,
    postedDaysAgo: 3,
    deadlineDays: 25,
  },
  {
    employerEmail: 'hr.bharatinfotech@jobseeker.in',
    title: 'Digital Marketing Executive',
    category: 'Marketing',
    description:
      'Plan and execute SEO, SEM and social media campaigns for our B2B clients. Measure performance and continuously improve campaign ROI.',
    responsibilities: ['Run Google Ads and Meta Ads campaigns', 'Improve organic search rankings', 'Report campaign performance monthly'],
    skills: ['SEO', 'Google Ads', 'Social Media Marketing', 'Google Analytics'],
    qualification: 'BBA',
    experience: '1-3 Years',
    experienceMin: 1,
    salaryMin: 28000,
    salaryMax: 42000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Maharashtra',
    district: 'Pune',
    city: 'Pune',
    vacancies: 2,
    postedDaysAgo: 5,
    deadlineDays: 18,
  },
  {
    employerEmail: 'hr.bharatinfotech@jobseeker.in',
    title: 'Customer Support Executive',
    category: 'Customer Support',
    description:
      'Support our domestic and international customers over chat, email and phone. This role is suitable for graduates with good communication skills.',
    responsibilities: ['Resolve customer queries', 'Maintain response quality', 'Escalate technical issues to the right team'],
    skills: ['Communication', 'Customer Service', 'English', 'Hindi'],
    qualification: 'Any Degree',
    experience: '0-1 Years',
    experienceMin: 0,
    salaryMin: 22000,
    salaryMax: 30000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Maharashtra',
    district: 'Thane',
    city: 'Navi Mumbai',
    vacancies: 15,
    postedDaysAgo: 6,
    deadlineDays: 20,
  },
  {
    employerEmail: 'talent@keralacare.example',
    title: 'Staff Nurse',
    category: 'Healthcare',
    description:
      'We are hiring experienced staff nurses for our multi-speciality clinics in Kochi. Candidates must have a valid nursing registration and be willing to work rotational shifts.',
    responsibilities: ['Provide patient care', 'Assist doctors during procedures', 'Maintain patient records'],
    skills: ['Patient Care', 'Nursing', 'Clinical Skills', 'Communication'],
    qualification: 'Bachelor Degree',
    experience: '1-3 Years',
    experienceMin: 1,
    salaryMin: 25000,
    salaryMax: 38000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Kerala',
    district: 'Ernakulam',
    city: 'Kochi',
    vacancies: 8,
    postedDaysAgo: 2,
    deadlineDays: 24,
  },
  {
    employerEmail: 'talent@keralacare.example',
    title: 'Accounts Executive',
    category: 'Accounting',
    description:
      'Handle day-to-day accounting entries, GST filings, vendor payments and monthly reconciliations for our clinic network.',
    responsibilities: ['Maintain books of accounts', 'Prepare GST returns', 'Reconcile bank statements'],
    skills: ['Tally', 'GST', 'Accounting', 'Excel'],
    qualification: 'B.Com',
    experience: '1-3 Years',
    experienceMin: 1,
    salaryMin: 22000,
    salaryMax: 32000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Kerala',
    district: 'Ernakulam',
    city: 'Kochi',
    vacancies: 1,
    postedDaysAgo: 7,
    deadlineDays: 15,
  },
  {
    employerEmail: 'demo.employer@jobseeker.in',
    title: 'HR Recruiter',
    category: 'Human Resources',
    description:
      'Own end-to-end recruitment for technology roles. Source candidates, coordinate interviews and maintain a strong candidate pipeline.',
    responsibilities: ['Source candidates from job portals and LinkedIn', 'Screen resumes and schedule interviews', 'Maintain recruitment trackers'],
    skills: ['Recruitment', 'Sourcing', 'Communication', 'HR Operations'],
    qualification: 'MBA',
    experience: '1-3 Years',
    experienceMin: 1,
    salaryMin: 30000,
    salaryMax: 45000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'Hybrid',
    state: 'Telangana',
    district: 'Hyderabad',
    city: 'Hyderabad',
    vacancies: 2,
    postedDaysAgo: 8,
    deadlineDays: 12,
  },
  {
    employerEmail: 'hr.bharatinfotech@jobseeker.in',
    title: 'Flutter Mobile App Developer',
    category: 'Mobile App Development',
    description:
      'Build cross-platform mobile applications using Flutter for fintech and retail clients. Experience publishing apps to Play Store and App Store is preferred.',
    responsibilities: ['Develop Flutter applications', 'Integrate REST APIs', 'Publish and maintain app releases'],
    skills: ['Flutter', 'Dart', 'Firebase', 'REST API', 'Git'],
    qualification: 'BCA',
    experience: '1-3 Years',
    experienceMin: 1,
    salaryMin: 40000,
    salaryMax: 65000,
    salaryPeriod: 'month',
    jobType: 'Contract',
    workMode: 'Remote',
    state: 'Gujarat',
    district: 'Ahmedabad',
    city: 'Ahmedabad',
    vacancies: 3,
    postedDaysAgo: 2,
    deadlineDays: 27,
  },
  {
    employerEmail: 'demo.employer@jobseeker.in',
    title: 'DevOps Engineer',
    category: 'Engineering',
    description:
      'We are looking for a DevOps Engineer to build and maintain CI/CD pipelines, container infrastructure and cloud deployments on AWS. You will work closely with development and security teams.',
    responsibilities: ['Maintain CI/CD pipelines', 'Manage Kubernetes and Docker workloads', 'Automate infrastructure with Terraform', 'Monitor production systems'],
    skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Terraform'],
    qualification: 'B.E / B.Tech',
    experience: '2-4 Years',
    experienceMin: 2,
    salaryMin: 55000,
    salaryMax: 90000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'Hybrid',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    vacancies: 3,
    postedDaysAgo: 1,
    deadlineDays: 30,
  },
  {
    employerEmail: 'hr.bharatinfotech@jobseeker.in',
    title: 'UI/UX Designer',
    category: 'Design',
    description:
      'Design intuitive web and mobile experiences for enterprise products. You will create wireframes, prototypes and high fidelity designs while working closely with product managers and engineers.',
    responsibilities: ['Create wireframes and prototypes', 'Conduct user research', 'Maintain the design system', 'Collaborate with developers'],
    skills: ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Wireframing'],
    qualification: 'Any Degree',
    experience: '1-3 Years',
    experienceMin: 1,
    salaryMin: 35000,
    salaryMax: 60000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Maharashtra',
    district: 'Pune',
    city: 'Pune',
    vacancies: 2,
    postedDaysAgo: 3,
    deadlineDays: 26,
  },
  {
    employerEmail: 'demo.employer@jobseeker.in',
    title: 'Python Developer',
    category: 'IT and Software Development',
    description:
      'Build backend services and data pipelines using Python, FastAPI and PostgreSQL. This is a fully remote role open to candidates across India.',
    responsibilities: ['Develop Python REST APIs', 'Write data processing pipelines', 'Write unit and integration tests', 'Collaborate with the data team'],
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'REST API', 'Git'],
    qualification: 'B.E / B.Tech',
    experience: '1-3 Years',
    experienceMin: 1,
    salaryMin: 45000,
    salaryMax: 80000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'Remote',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    vacancies: 4,
    postedDaysAgo: 4,
    deadlineDays: 29,
  },
  {
    employerEmail: 'hr.bharatinfotech@jobseeker.in',
    title: 'Business Development Manager',
    category: 'Sales',
    description:
      'Drive new business for our IT services portfolio. You will build relationships with enterprise clients, prepare proposals and close deals across India and the Middle East.',
    responsibilities: ['Identify and pursue new clients', 'Prepare proposals and pitches', 'Negotiate contracts', 'Meet quarterly revenue targets'],
    skills: ['B2B Sales', 'Negotiation', 'Client Relationship', 'Presentation', 'CRM'],
    qualification: 'MBA',
    experience: '3-5 Years',
    experienceMin: 3,
    salaryMin: 60000,
    salaryMax: 100000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Maharashtra',
    district: 'Mumbai City',
    city: 'Mumbai',
    vacancies: 2,
    postedDaysAgo: 5,
    deadlineDays: 23,
  },
  {
    employerEmail: 'talent@keralacare.example',
    title: 'Medical Lab Technician',
    category: 'Healthcare',
    description:
      'Perform laboratory tests and maintain accurate reports at our diagnostic centres. Candidates must have a recognised DMLT or BSc MLT qualification.',
    responsibilities: ['Collect and process samples', 'Run diagnostic tests', 'Maintain lab equipment', 'Record and report results'],
    skills: ['Laboratory Testing', 'Sample Collection', 'Quality Control', 'Communication'],
    qualification: 'Diploma',
    experience: '0-1 Years',
    experienceMin: 0,
    salaryMin: 18000,
    salaryMax: 28000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Kerala',
    district: 'Ernakulam',
    city: 'Kochi',
    vacancies: 3,
    postedDaysAgo: 2,
    deadlineDays: 21,
  },
  {
    employerEmail: 'demo.employer@jobseeker.in',
    title: 'QA Automation Engineer',
    category: 'Engineering',
    description:
      'Own test automation for our web platform using Playwright and Selenium. You will build reliable test suites, track defects and work with developers to improve quality.',
    responsibilities: ['Write automated test scripts', 'Maintain regression suites', 'Report and track defects', 'Integrate tests into CI'],
    skills: ['Playwright', 'Selenium', 'JavaScript', 'API Testing', 'CI/CD'],
    qualification: 'B.E / B.Tech',
    experience: '1-3 Years',
    experienceMin: 1,
    salaryMin: 40000,
    salaryMax: 70000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'Hybrid',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    vacancies: 2,
    postedDaysAgo: 6,
    deadlineDays: 24,
  },
  {
    employerEmail: 'hr.bharatinfotech@jobseeker.in',
    title: 'Content Writer',
    category: 'Marketing',
    description:
      'Write clear, engaging content for our website, blogs and marketing campaigns. This is a part time remote role suitable for experienced writers.',
    responsibilities: ['Write SEO friendly blog articles', 'Create marketing copy', 'Edit and proofread content', 'Coordinate with the marketing team'],
    skills: ['Content Writing', 'SEO', 'Editing', 'Research', 'English'],
    qualification: 'Any Degree',
    experience: '1-3 Years',
    experienceMin: 1,
    salaryMin: 15000,
    salaryMax: 25000,
    salaryPeriod: 'month',
    jobType: 'Part Time',
    workMode: 'Remote',
    state: 'Maharashtra',
    district: 'Pune',
    city: 'Pune',
    vacancies: 2,
    postedDaysAgo: 7,
    deadlineDays: 19,
  },
  {
    employerEmail: 'talent@keralacare.example',
    title: 'Pharmacy Assistant',
    category: 'Healthcare',
    description:
      'Assist pharmacists with dispensing medicines, stock management and customer support at our clinic pharmacies in Thiruvananthapuram.',
    responsibilities: ['Assist with dispensing medicines', 'Manage medicine stock', 'Maintain billing records', 'Help customers with queries'],
    skills: ['Pharmacy', 'Inventory Management', 'Customer Service', 'Attention to Detail'],
    qualification: 'Diploma',
    experience: '0-1 Years',
    experienceMin: 0,
    salaryMin: 16000,
    salaryMax: 24000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Kerala',
    district: 'Thiruvananthapuram',
    city: 'Thiruvananthapuram',
    vacancies: 2,
    postedDaysAgo: 3,
    deadlineDays: 18,
  },
  {
    employerEmail: 'hr.bharatinfotech@jobseeker.in',
    title: 'Sales Executive',
    category: 'Sales',
    description:
      'Sell our software products to small and medium businesses. You will generate leads, run product demos and achieve monthly sales targets.',
    responsibilities: ['Generate leads through calls and visits', 'Give product demonstrations', 'Follow up with prospects', 'Achieve monthly targets'],
    skills: ['Sales', 'Lead Generation', 'Communication', 'Negotiation'],
    qualification: 'Any Degree',
    experience: '0-2 Years',
    experienceMin: 0,
    salaryMin: 20000,
    salaryMax: 35000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    city: 'Coimbatore',
    vacancies: 6,
    postedDaysAgo: 4,
    deadlineDays: 22,
  },
  {
    employerEmail: 'demo.employer@jobseeker.in',
    title: 'Cloud Support Engineer',
    category: 'IT and Software Development',
    description:
      'Provide technical support for AWS and Azure cloud customers. Troubleshoot infrastructure, networking and application issues on rotational shifts.',
    responsibilities: ['Troubleshoot cloud infrastructure issues', 'Respond to customer tickets', 'Document solutions', 'Escalate complex issues'],
    skills: ['AWS', 'Azure', 'Linux', 'Networking', 'Troubleshooting'],
    qualification: 'B.E / B.Tech',
    experience: '0-2 Years',
    experienceMin: 0,
    salaryMin: 30000,
    salaryMax: 50000,
    salaryPeriod: 'month',
    jobType: 'Full Time',
    workMode: 'Remote',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    vacancies: 8,
    postedDaysAgo: 1,
    deadlineDays: 30,
  },
];

const DEMO_GOVERNMENT_JOBS = [
  {
    title: 'Combined Graduate Level (CGL) 2026',
    category: 'SSC',
    description:
      'Staff Selection Commission invites online applications for Combined Graduate Level Examination 2026 for recruitment to various Group B and Group C posts in central government ministries and departments across India.',
    responsibilities: [
      'Appear for Tier-I and Tier-II computer based examinations',
      'Meet eligibility and document verification requirements',
      'Serve at allocated central government departments',
    ],
    skills: ['General Awareness', 'Quantitative Aptitude', 'English', 'Reasoning'],
    qualification: 'Bachelor Degree',
    experience: 'Fresher',
    experienceMin: 0,
    salaryText: '₹25,500 - ₹81,100 per month (Level 4 to Level 8)',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Delhi',
    district: 'New Delhi',
    city: 'New Delhi',
    vacancies: 1450,
    postedDaysAgo: 3,
    deadlineDays: 25,
    government: {
      organization: 'Staff Selection Commission (SSC)',
      department: 'Ministry of Personnel, Public Grievances and Pensions',
      notificationNumber: 'SSC/CGL/2026/01',
      postName: 'Assistant Section Officer, Inspector, Auditor and other posts',
      ageLimit: '18 - 32 years (relaxation as per rules)',
      eligibility: 'Bachelor degree in any discipline from a recognised university.',
      payScale: '₹25,500 - ₹81,100',
      selectionProcess: 'Tier-I CBT, Tier-II CBT, Skill Test and Document Verification',
      applicationFee: '₹100 (exemptions for SC/ST/PwD/Ex-Servicemen and women)',
      officialWebsite: 'https://ssc.gov.in',
      isVerified: true,
    },
  },
  {
    title: 'Probationary Officer Recruitment 2026',
    category: 'Banking',
    description:
      'A leading public sector bank invites applications for the post of Probationary Officer through a nationwide competitive examination. Selected candidates will undergo structured training before being posted across branches.',
    responsibilities: [
      'Handle banking operations and customer relations',
      'Complete the prescribed probationary training programme',
      'Support branch administration and business development',
    ],
    skills: ['Banking Awareness', 'Quantitative Aptitude', 'English', 'Computer Knowledge'],
    qualification: 'Bachelor Degree',
    experience: 'Fresher',
    experienceMin: 0,
    salaryText: '₹48,480 - ₹85,920 per month plus allowances',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Maharashtra',
    district: 'Mumbai City',
    city: 'Mumbai',
    vacancies: 1200,
    postedDaysAgo: 5,
    deadlineDays: 20,
    government: {
      organization: 'Institute of Banking Personnel Selection (IBPS)',
      department: 'Public Sector Banks',
      notificationNumber: 'IBPS/PO/2026/02',
      postName: 'Probationary Officer / Management Trainee',
      ageLimit: '20 - 30 years',
      eligibility: 'Graduation in any discipline from a recognised university.',
      payScale: '₹48,480 - ₹85,920',
      selectionProcess: 'Preliminary Exam, Main Exam and Interview',
      applicationFee: '₹850 (₹175 for SC/ST/PwD candidates)',
      officialWebsite: 'https://www.ibps.in',
      isVerified: true,
    },
  },
  {
    title: 'RRB Group D Level 1 Recruitment 2026',
    category: 'Railway',
    description:
      'Railway Recruitment Board invites applications for Level 1 posts across Indian Railways. Recruitment is for various divisions and zones with vacancies for Track Maintainer, Helper, Assistant and related roles.',
    responsibilities: [
      'Carry out assigned operational and maintenance duties',
      'Follow railway safety and operational guidelines',
      'Work in shifts at designated railway divisions',
    ],
    skills: ['General Awareness', 'Basic Mathematics', 'Reasoning', 'Physical Fitness'],
    qualification: '10th Pass',
    experience: 'Fresher',
    experienceMin: 0,
    salaryText: '₹18,000 - ₹56,900 per month (Level 1)',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Kerala',
    district: 'Ernakulam',
    city: 'Kochi',
    vacancies: 3200,
    postedDaysAgo: 2,
    deadlineDays: 30,
    government: {
      organization: 'Indian Railways',
      department: 'Railway Recruitment Board',
      notificationNumber: 'RRB/GROUPD/2026/03',
      postName: 'Track Maintainer, Helper and Assistant',
      ageLimit: '18 - 33 years',
      eligibility: 'Pass in 10th standard (Matriculation) or ITI from a recognised institution.',
      payScale: '₹18,000 - ₹56,900',
      selectionProcess: 'Computer Based Test, Physical Efficiency Test and Document Verification',
      applicationFee: '₹500 (₹250 refundable for eligible candidates; exempt for women/SC/ST/PwD)',
      officialWebsite: 'https://www.rrbcdg.gov.in',
      isVerified: true,
    },
  },
  {
    title: 'Kerala PSC Lower Division Clerk (LDC) 2026',
    category: 'Kerala PSC',
    description:
      'Kerala Public Service Commission invites applications for the post of Lower Division Clerk in various state government departments. Candidates must possess the required qualification and pass the OMR based examination.',
    responsibilities: [
      'Handle clerical and administrative duties in government offices',
      'Maintain files, records and data entry',
      'Assist senior officers with day-to-day office work',
    ],
    skills: ['Kerala State Knowledge', 'General English', 'Mathematics', 'Reasoning'],
    qualification: '12th Pass',
    experience: 'Fresher',
    experienceMin: 0,
    salaryText: '₹16,500 - ₹37,600 per month',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Kerala',
    district: 'Thiruvananthapuram',
    city: 'Thiruvananthapuram',
    vacancies: 480,
    postedDaysAgo: 1,
    deadlineDays: 28,
    government: {
      organization: 'Kerala Public Service Commission (Kerala PSC)',
      department: 'Various State Government Departments',
      notificationNumber: 'KERALA/LDC/2026/04',
      postName: 'Lower Division Clerk',
      ageLimit: '18 - 36 years',
      eligibility: 'Pass in Plus Two (12th standard) and computer proficiency as prescribed.',
      payScale: '₹16,500 - ₹37,600',
      selectionProcess: 'Written/OMR Examination and Certificate Verification',
      applicationFee: 'As prescribed by Kerala PSC (concessions available)',
      officialWebsite: 'https://www.keralapsc.gov.in',
      isVerified: false,
    },
  },
  {
    title: 'UPSC Civil Services Preliminary Examination 2026',
    category: 'UPSC',
    description:
      'Union Public Service Commission will conduct the Civil Services Preliminary Examination 2026 for recruitment to the Indian Administrative Service, Indian Police Service and other central services. This is the entry stage of the Civil Services Examination.',
    responsibilities: [
      'Appear for the Preliminary and Main examinations',
      'Clear the Personality Test / Interview',
      'Serve in the allocated civil service cadre',
    ],
    skills: ['Current Affairs', 'General Studies', 'Aptitude', 'Essay Writing'],
    qualification: 'Bachelor Degree',
    experience: 'Fresher',
    experienceMin: 0,
    salaryText: 'Pay as per central government scales (Level 10 and above)',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Delhi',
    district: 'New Delhi',
    city: 'New Delhi',
    vacancies: 1000,
    postedDaysAgo: 6,
    deadlineDays: 22,
    government: {
      organization: 'Union Public Service Commission (UPSC)',
      department: 'Department of Personnel and Training',
      notificationNumber: 'UPSC/CSE/2026/05',
      postName: 'Civil Services (IAS / IPS / IFS and allied services)',
      ageLimit: '21 - 32 years (relaxation as per rules)',
      eligibility: 'Bachelor degree in any discipline from a recognised university.',
      payScale: 'Level 10 and above of the 7th CPC pay matrix',
      selectionProcess: 'Preliminary Examination, Main Examination and Personality Test',
      applicationFee: '₹100 (exempt for SC/ST/PwD and women candidates)',
      officialWebsite: 'https://upsc.gov.in',
      isVerified: true,
    },
  },
  {
    title: 'SBI Junior Associate (Clerk) 2026',
    category: 'Banking',
    description:
      'State Bank of India invites online applications for the post of Junior Associate (Customer Support & Sales) in clerical cadre across branches in India. Selected candidates will be posted across states based on vacancy and preference.',
    responsibilities: ['Handle customer transactions at the branch', 'Support account opening and KYC', 'Assist with daily branch operations'],
    skills: ['Banking Awareness', 'Numerical Ability', 'Reasoning', 'English', 'Computer Knowledge'],
    qualification: 'Bachelor Degree',
    experience: 'Fresher',
    experienceMin: 0,
    salaryText: '₹26,730 - ₹47,920 per month plus allowances',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Maharashtra',
    district: 'Mumbai City',
    city: 'Mumbai',
    vacancies: 8773,
    postedDaysAgo: 4,
    deadlineDays: 26,
    government: {
      organization: 'State Bank of India (SBI)',
      department: 'Clerical Cadre',
      notificationNumber: 'SBI/CLERK/2026/06',
      postName: 'Junior Associate (Customer Support & Sales)',
      ageLimit: '20 - 28 years (relaxation as per rules)',
      eligibility: 'Graduation in any discipline from a recognised university.',
      payScale: '₹26,730 - ₹47,920',
      selectionProcess: 'Preliminary Exam, Main Exam and Language Test',
      applicationFee: '₹750 (₹125 for SC/ST/PwD candidates)',
      officialWebsite: 'https://sbi.co.in/careers',
      isVerified: true,
    },
  },
  {
    title: 'SSC CHSL 2026',
    category: 'SSC',
    description:
      'Staff Selection Commission invites applications for the Combined Higher Secondary Level Examination 2026 for recruitment to posts of Lower Division Clerk, Data Entry Operator and Postal Assistant in various central government offices.',
    responsibilities: ['Appear for Tier-I and Tier-II examinations', 'Clear the typing or skill test', 'Serve in allocated central government departments'],
    skills: ['General Awareness', 'Quantitative Aptitude', 'English', 'Reasoning', 'Typing'],
    qualification: '12th Pass',
    experience: 'Fresher',
    experienceMin: 0,
    salaryText: '₹19,900 - ₹63,200 per month (Level 2 to Level 5)',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Delhi',
    district: 'New Delhi',
    city: 'New Delhi',
    vacancies: 3712,
    postedDaysAgo: 6,
    deadlineDays: 24,
    government: {
      organization: 'Staff Selection Commission (SSC)',
      department: 'Ministry of Personnel, Public Grievances and Pensions',
      notificationNumber: 'SSC/CHSL/2026/07',
      postName: 'LDC, DEO, Postal Assistant and Sorting Assistant',
      ageLimit: '18 - 27 years (relaxation as per rules)',
      eligibility: 'Pass in 12th standard from a recognised board.',
      payScale: '₹19,900 - ₹63,200',
      selectionProcess: 'Tier-I CBT, Tier-II CBT and Skill/Typing Test',
      applicationFee: '₹100 (exempt for SC/ST/PwD/Ex-Servicemen and women)',
      officialWebsite: 'https://ssc.gov.in',
      isVerified: true,
    },
  },
  {
    title: 'RBI Grade B Officer 2026',
    category: 'Banking',
    description:
      'Reserve Bank of India invites applications for the post of Grade B Officer in the Reserve Bank. This is a prestigious central banking role involving policy, supervision and operations.',
    responsibilities: ['Participate in central banking operations', 'Assist in supervision and regulation', 'Undertake research and analysis'],
    skills: ['Economics', 'Finance', 'Quantitative Aptitude', 'English', 'Current Affairs'],
    qualification: 'Bachelor Degree',
    experience: 'Fresher',
    experienceMin: 0,
    salaryText: '₹55,200 - ₹99,750 per month plus allowances',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Maharashtra',
    district: 'Mumbai City',
    city: 'Mumbai',
    vacancies: 291,
    postedDaysAgo: 3,
    deadlineDays: 27,
    government: {
      organization: 'Reserve Bank of India (RBI)',
      department: 'Reserve Bank Services',
      notificationNumber: 'RBI/GRADEB/2026/08',
      postName: 'Grade B Officer',
      ageLimit: '21 - 30 years (relaxation as per rules)',
      eligibility: 'Bachelor degree with minimum 60% marks (relaxation as per rules).',
      payScale: '₹55,200 - ₹99,750',
      selectionProcess: 'Phase-I Exam, Phase-II Exam and Interview',
      applicationFee: '₹850 (₹100 for SC/ST/PwD candidates)',
      officialWebsite: 'https://www.rbi.org.in',
      isVerified: true,
    },
  },
  {
    title: 'India Post Gramin Dak Sevak 2026',
    category: 'Postal',
    description:
      'India Post invites applications for Gramin Dak Sevak posts including Branch Postmaster, Assistant Branch Postmaster and Dak Sevak across postal circles. Selection is merit based on 10th standard marks.',
    responsibilities: ['Handle postal services at branch offices', 'Deliver mail and parcels', 'Maintain postal records'],
    skills: ['General Knowledge', 'Basic Mathematics', 'Local Language', 'Communication'],
    qualification: '10th Pass',
    experience: 'Fresher',
    experienceMin: 0,
    salaryText: '₹10,000 - ₹29,380 per month',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Kerala',
    district: 'Kollam',
    city: 'Kollam',
    vacancies: 2100,
    postedDaysAgo: 2,
    deadlineDays: 29,
    government: {
      organization: 'India Post',
      department: 'Department of Posts',
      notificationNumber: 'INDIA/POST/GDS/2026/09',
      postName: 'Gramin Dak Sevak (BPM/ABPM/Dak Sevak)',
      ageLimit: '18 - 40 years (relaxation as per rules)',
      eligibility: 'Pass in 10th standard with local language knowledge.',
      payScale: '₹10,000 - ₹29,380',
      selectionProcess: 'Merit based on 10th standard marks and document verification',
      applicationFee: '₹100 (exempt for female/SC/ST/PwD candidates)',
      officialWebsite: 'https://www.indiapostgdsonline.gov.in',
      isVerified: false,
    },
  },
  {
    title: 'NTPC Executive Trainee 2026',
    category: 'PSU',
    description:
      'NTPC Limited invites applications for Executive Trainee posts in engineering disciplines through GATE 2026 scores. Selected candidates will undergo training and be placed across NTPC power stations.',
    responsibilities: ['Complete the executive training programme', 'Support plant operations and maintenance', 'Work at allocated NTPC stations'],
    skills: ['Engineering Fundamentals', 'Problem Solving', 'Teamwork', 'Technical Aptitude'],
    qualification: 'B.E / B.Tech',
    experience: 'Fresher',
    experienceMin: 0,
    salaryText: '₹40,000 - ₹1,40,000 per month (E1 grade)',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Delhi',
    district: 'New Delhi',
    city: 'New Delhi',
    vacancies: 400,
    postedDaysAgo: 5,
    deadlineDays: 23,
    government: {
      organization: 'NTPC Limited',
      department: 'Human Resources',
      notificationNumber: 'NTPC/ET/2026/10',
      postName: 'Executive Trainee',
      ageLimit: 'Up to 27 years (relaxation as per rules)',
      eligibility: 'B.E / B.Tech in relevant discipline with valid GATE 2026 score.',
      payScale: '₹40,000 - ₹1,40,000',
      selectionProcess: 'GATE 2026 score, Group Discussion and Personal Interview',
      applicationFee: '₹300 (exempt for SC/ST/PwD/female candidates)',
      officialWebsite: 'https://careers.ntpc.co.in',
      isVerified: true,
    },
  },
  {
    title: 'Kerala PSC Police Constable 2026',
    category: 'Kerala PSC',
    description:
      'Kerala Public Service Commission invites applications for the post of Police Constable (Armed Police Battalion) in the Kerala Police. Candidates must meet physical standards and pass the OMR examination and physical efficiency test.',
    responsibilities: ['Maintain law and order', 'Perform police duties as assigned', 'Complete physical training'],
    skills: ['Kerala State Knowledge', 'General Knowledge', 'Physical Fitness', 'Reasoning'],
    qualification: '12th Pass',
    experience: 'Fresher',
    experienceMin: 0,
    salaryText: '₹22,200 - ₹48,000 per month',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Kerala',
    district: 'Thiruvananthapuram',
    city: 'Thiruvananthapuram',
    vacancies: 750,
    postedDaysAgo: 1,
    deadlineDays: 30,
    government: {
      organization: 'Kerala Public Service Commission (Kerala PSC)',
      department: 'Kerala Police',
      notificationNumber: 'KERALA/PC/2026/11',
      postName: 'Police Constable (Armed Police Battalion)',
      ageLimit: '18 - 26 years (relaxation as per rules)',
      eligibility: 'Pass in Plus Two (12th standard) and prescribed physical standards.',
      payScale: '₹22,200 - ₹48,000',
      selectionProcess: 'OMR Examination, Physical Efficiency Test and Medical Test',
      applicationFee: 'As prescribed by Kerala PSC (concessions available)',
      officialWebsite: 'https://www.keralapsc.gov.in',
      isVerified: false,
    },
  },
  {
    title: 'ISRO Scientist/Engineer 2026',
    category: 'PSU',
    description:
      'Indian Space Research Organisation invites applications for Scientist/Engineer SC posts through the ISRO Centralised Recruitment Board. Candidates must hold a first class BE/BTech with a valid GATE score.',
    responsibilities: ['Contribute to space research and development', 'Work on satellite and launch vehicle projects', 'Perform engineering design and analysis'],
    skills: ['Engineering Fundamentals', 'Research Aptitude', 'Problem Solving', 'Technical Writing'],
    qualification: 'B.E / B.Tech',
    experience: 'Fresher',
    experienceMin: 0,
    salaryText: '₹56,100 - ₹1,77,500 per month (Level 10)',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    vacancies: 120,
    postedDaysAgo: 4,
    deadlineDays: 25,
    government: {
      organization: 'Indian Space Research Organisation (ISRO)',
      department: 'ISRO Centralised Recruitment Board',
      notificationNumber: 'ISRO/ICRB/2026/12',
      postName: 'Scientist / Engineer SC',
      ageLimit: 'Up to 28 years (relaxation as per rules)',
      eligibility: 'First class BE/BTech in relevant discipline with valid GATE score.',
      payScale: '₹56,100 - ₹1,77,500',
      selectionProcess: 'GATE score, Written Test and Interview',
      applicationFee: '₹250 (exempt for SC/ST/PwD/female candidates)',
      officialWebsite: 'https://www.isro.gov.in',
      isVerified: true,
    },
  },
  {
    title: 'DRDO Scientist B 2026',
    category: 'Defence',
    description:
      'Defence Research and Development Organisation invites applications for Scientist B posts through the Recruitment and Assessment Centre. Selected candidates will work on defence research projects across DRDO laboratories.',
    responsibilities: ['Conduct defence research and development', 'Design and test defence systems', 'Publish technical reports'],
    skills: ['Engineering Fundamentals', 'Research Aptitude', 'Analytical Skills', 'Technical Writing'],
    qualification: 'B.E / B.Tech',
    experience: 'Fresher',
    experienceMin: 0,
    salaryText: '₹56,100 - ₹1,77,500 per month (Level 10)',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Delhi',
    district: 'New Delhi',
    city: 'New Delhi',
    vacancies: 250,
    postedDaysAgo: 6,
    deadlineDays: 21,
    government: {
      organization: 'Defence Research and Development Organisation (DRDO)',
      department: 'Recruitment and Assessment Centre',
      notificationNumber: 'DRDO/RAC/2026/13',
      postName: 'Scientist B',
      ageLimit: 'Up to 28 years (relaxation as per rules)',
      eligibility: 'First class BE/BTech or equivalent in relevant discipline.',
      payScale: '₹56,100 - ₹1,77,500',
      selectionProcess: 'Written Examination and Personal Interview',
      applicationFee: '₹100 (exempt for SC/ST/PwD/female candidates)',
      officialWebsite: 'https://rac.gov.in',
      isVerified: true,
    },
  },
  {
    title: 'ESIC Staff Nurse 2026',
    category: 'Healthcare',
    description:
      'Employees State Insurance Corporation invites applications for Staff Nurse posts at ESIC hospitals and dispensaries across India. Candidates must have a valid nursing qualification and registration.',
    responsibilities: ['Provide nursing care to patients', 'Assist doctors in procedures', 'Maintain patient records', 'Work in rotational shifts'],
    skills: ['Nursing', 'Patient Care', 'Clinical Skills', 'Communication'],
    qualification: 'Diploma',
    experience: 'Fresher',
    experienceMin: 0,
    salaryText: '₹35,400 - ₹1,12,400 per month (Level 7)',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Maharashtra',
    district: 'Mumbai City',
    city: 'Mumbai',
    vacancies: 550,
    postedDaysAgo: 2,
    deadlineDays: 20,
    government: {
      organization: 'Employees State Insurance Corporation (ESIC)',
      department: 'Medical Wing',
      notificationNumber: 'ESIC/NURSE/2026/14',
      postName: 'Staff Nurse',
      ageLimit: 'Up to 37 years (relaxation as per rules)',
      eligibility: 'Diploma in Nursing or BSc Nursing with valid registration.',
      payScale: '₹35,400 - ₹1,12,400',
      selectionProcess: 'Written Examination and Document Verification',
      applicationFee: '₹500 (₹250 for SC/ST/PwD candidates)',
      officialWebsite: 'https://www.esic.gov.in',
      isVerified: false,
    },
  },
  {
    title: 'SBI Apprentice 2026',
    category: 'Banking',
    description:
      'State Bank of India invites applications for Apprentice posts under the Apprentices Act 1961. This is a one year apprenticeship programme offering on-the-job training in banking operations.',
    responsibilities: ['Complete the one year apprenticeship', 'Learn banking operations', 'Support branch staff'],
    skills: ['Banking Awareness', 'Communication', 'Computer Knowledge', 'Customer Service'],
    qualification: 'Bachelor Degree',
    experience: 'Fresher',
    experienceMin: 0,
    salaryText: '₹15,000 per month (stipend)',
    jobType: 'Full Time',
    workMode: 'On-site',
    state: 'Tamil Nadu',
    district: 'Chennai',
    city: 'Chennai',
    vacancies: 6100,
    postedDaysAgo: 3,
    deadlineDays: 28,
    government: {
      organization: 'State Bank of India (SBI)',
      department: 'Apprentice Programme',
      notificationNumber: 'SBI/APPRENTICE/2026/15',
      postName: 'Apprentice',
      ageLimit: '20 - 28 years (relaxation as per rules)',
      eligibility: 'Graduation in any discipline from a recognised university.',
      payScale: '₹15,000 stipend per month',
      selectionProcess: 'Online Written Test and Local Language Test',
      applicationFee: '₹300 (₹75 for SC/ST/PwD candidates)',
      officialWebsite: 'https://sbi.co.in/careers',
      isVerified: true,
    },
  },
];

async function seedGovernmentJobs(admin) {
  if (!admin) return;

  for (const govJob of DEMO_GOVERNMENT_JOBS) {
    const existing = await Job.findOne({ sector: 'government', title: govJob.title });
    if (existing) {
      console.log(`Government job already exists: ${govJob.title}`);
      continue;
    }

    const { government, postedDaysAgo, deadlineDays, salaryText, ...rest } = govJob;
    const job = await Job.create({
      ...rest,
      employer: admin._id,
      sector: 'government',
      salaryMin: null,
      salaryMax: null,
      salaryPeriod: 'month',
      salaryText: salaryText || '',
      location: {
        state: govJob.state,
        district: govJob.district,
        city: govJob.city,
        pincode: '',
      },
      postedDate: daysAgo(postedDaysAgo),
      applicationDeadline: daysFromNow(deadlineDays),
      status: 'approved',
      isActive: true,
      companyName: government.organization,
      companyLogo: '',
      approvedBy: admin._id,
      approvedAt: new Date(),
      government: {
        ...government,
        applicationStartDate: daysAgo(postedDaysAgo),
        examDate: null,
        notificationPdf: '',
        verifiedBy: government.isVerified ? admin._id : null,
        verifiedAt: government.isVerified ? new Date() : null,
        verificationNotes: '',
      },
    });
    console.log(`Created government job: ${job.title}`);
  }
}

async function seedDemo(admin) {
  const employerUsers = {};

  for (const data of DEMO_EMPLOYERS) {
    const user = await ensureUser({ ...data, role: 'employer' });
    employerUsers[data.email] = user;

    const existingProfile = await EmployerProfile.findOne({ user: user._id });
    if (!existingProfile) {
      await EmployerProfile.create({
        user: user._id,
        companyName: data.companyName,
        companyEmail: data.companyEmail,
        contactNumber: data.phone,
        website: data.website,
        industry: data.industry,
        companySize: data.companySize,
        address: data.address,
        state: data.state,
        district: data.district,
        city: data.city,
        description: data.description,
        isVerified: data.isVerified,
        verifiedAt: data.isVerified ? new Date() : null,
      });
      console.log(`Created employer profile: ${data.companyName}`);
    }
  }

  const seeker = await ensureUser({
    name: 'Demo Job Seeker',
    email: 'demo.seeker@jobseeker.in',
    phone: '9876500010',
    password: 'Demo@12345',
    role: 'jobseeker',
  });

  const seekerProfile = await JobSeekerProfile.findOne({ user: seeker._id });
  if (!seekerProfile) {
    await JobSeekerProfile.create({
      user: seeker._id,
      fullName: 'Demo Job Seeker',
      phone: '9876500010',
      state: 'Kerala',
      district: 'Ernakulam',
      city: 'Kochi',
      address: 'Kakkanad, Kochi',
      education: 'B.E / B.Tech',
      collegeName: 'Cochin University of Science and Technology',
      graduationYear: 2024,
      skills: ['React.js', 'Node.js', 'JavaScript', 'MongoDB', 'SQL'],
      experience: 'Fresher',
      careerObjective:
        'Motivated software engineering graduate looking for a full stack development role where I can contribute to real products and grow quickly.',
    });
    console.log('Created demo job seeker profile (upload a resume to apply).');
  }

  const createdJobs = [];
  for (const jobData of DEMO_JOBS) {
    const employer = employerUsers[jobData.employerEmail];
    if (!employer) continue;
    const employerProfile = await EmployerProfile.findOne({ user: employer._id });

    const existing = await Job.findOne({ employer: employer._id, title: jobData.title });
    if (existing) {
      createdJobs.push(existing);
      continue;
    }

    const job = await Job.create({
      employer: employer._id,
      sector: 'private',
      title: jobData.title,
      category: jobData.category,
      description: jobData.description,
      responsibilities: jobData.responsibilities,
      skills: jobData.skills,
      qualification: jobData.qualification,
      experience: jobData.experience,
      experienceMin: jobData.experienceMin,
      salaryMin: jobData.salaryMin,
      salaryMax: jobData.salaryMax,
      salaryPeriod: jobData.salaryPeriod,
      jobType: jobData.jobType,
      workMode: jobData.workMode,
      location: { state: jobData.state, district: jobData.district, city: jobData.city, pincode: '' },
      vacancies: jobData.vacancies,
      postedDate: daysAgo(jobData.postedDaysAgo),
      applicationDeadline: daysFromNow(jobData.deadlineDays),
      status: 'approved',
      isActive: true,
      companyName: employerProfile.companyName,
      companyLogo: employerProfile.logo || '',
    });
    createdJobs.push(job);
    console.log(`Created demo job: ${job.title}`);
  }

  if (createdJobs.length >= 2) {
    const existingApp = await Application.findOne({ job: createdJobs[0]._id, jobSeeker: seeker._id });
    if (!existingApp) {
      await Application.create({
        job: createdJobs[0]._id,
        jobSeeker: seeker._id,
        employer: createdJobs[0].employer,
        status: 'Under Review',
        coverLetter: 'I am very interested in this role and believe my MERN stack skills are a strong fit.',
        appliedAt: daysAgo(1),
        statusHistory: [
          { status: 'Submitted', changedBy: seeker._id, changedAt: daysAgo(1) },
          { status: 'Under Review', changedBy: createdJobs[0].employer, changedAt: new Date() },
        ],
      });
      console.log('Created demo application (Under Review).');
    }
  }

  await Notification.create({
    user: seeker._id,
    type: 'system',
    title: 'Welcome to the JobSeeker demo',
    message: 'Your demo account is ready. Upload a resume from the Resume page to apply for private jobs.',
    link: '/dashboard/resume',
  });

  await seedGovernmentJobs(admin);

  console.log('Demo data seeding complete.');
}

async function main() {
  await connectDB();
  const admin = await ensureAdmin();

  if (WITH_DEMO) {
    await seedDemo(admin);
  } else {
    console.log('Skipping demo data. Run "npm run seed:demo" inside server/ to add demo employers, jobs and a job seeker.');
  }

  console.log('Seeding finished.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
