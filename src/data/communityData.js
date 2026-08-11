import { Brain, Cloud, Code, Shield, Layout, Users } from 'lucide-react'

export const INITIAL_COMMUNITIES = [
  {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    icon: Brain,
    membersCount: 2420,
    membersDisplay: '2.4k',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    accentBg: 'bg-purple-500',
    description: 'Explore artificial intelligence, deep learning, neural networks, LLMs, and computer vision with students, researchers, and industry AI engineers.',
    discussions: [
      {
        id: 'disc-aiml-1',
        title: 'Fine-tuning LLaMA 3 on custom datasets — Best practices & VRAM optimization?',
        author: 'Alex Rivera',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        role: 'AI Research Scholar',
        time: '2 hours ago',
        replies: 18,
        views: 240,
        content: 'I am fine-tuning LLaMA 3 8B using LoRA and QLoRA on a single RTX 4090. What gradient accumulation steps and batch sizes are you using to prevent OOM errors?'
      },
      {
        id: 'disc-aiml-2',
        title: 'PyTorch vs TensorFlow for Computer Vision & Object Detection in 2026',
        author: 'Priya Sharma',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
        role: 'Student (B.Tech AI)',
        time: 'Yesterday',
        replies: 34,
        views: 510,
        content: 'While PyTorch continues to dominate academic research, TensorFlow/TFLite is still widely used in mobile deployment. What framework should beginners prioritize for industry readiness?'
      },
      {
        id: 'disc-aiml-3',
        title: 'Getting started with Retrieval-Augmented Generation (RAG) using LangChain & ChromaDB',
        author: 'Marcus Chen',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
        role: 'Alumni (ML Engineer)',
        time: '3 days ago',
        replies: 22,
        views: 390,
        content: 'RAG is essential for reducing LLM hallucinations. Here is a simplified breakdown of chunking strategies, vector database selection, and embedding models.'
      }
    ],
    members: [
      { id: 'mem-aiml-1', name: 'Dr. Aris Thorne', role: 'Mentor', title: 'AI Research Scientist at DeepMind', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80' },
      { id: 'mem-aiml-2', name: 'Sophia Martinez', role: 'Alumni', title: 'ML Engineer at OpenAI', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80' },
      { id: 'mem-aiml-3', name: 'David Kim', role: 'Student', title: 'B.Tech CS — AI/ML Specialist', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80' },
      { id: 'mem-aiml-4', name: 'Ananya Roy', role: 'Student', title: 'Data Science Aspirant', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80' }
    ],
    resources: [
      {
        id: 'res-aiml-1',
        title: 'Machine Learning Roadmap',
        type: 'Roadmap',
        description: 'Complete 2026 step-by-step learning path from Mathematics & Python to Deep Learning & MLOps.',
        linkText: 'Explore Roadmap',
        details: 'Includes Linear Algebra, Calculus, Supervised/Unsupervised Learning, Neural Networks, PyTorch, Transformers, and MLOps deployment pipelines.'
      },
      {
        id: 'res-aiml-2',
        title: 'Python for ML',
        type: 'Guide',
        description: 'Comprehensive crash course on NumPy, Pandas, Scikit-Learn, and PyTorch essentials.',
        linkText: 'Read Guide',
        details: 'Master data manipulation with Pandas, vector operations with NumPy, Model Evaluation with Scikit-Learn, and Tensor operations in PyTorch.'
      },
      {
        id: 'res-aiml-3',
        title: 'AI Project Ideas',
        type: 'Projects',
        description: '15 portfolio-ready Machine Learning & LLM project ideas with starter code repositories.',
        linkText: 'View Projects',
        details: 'Build projects like Automated Medical Image Classification, Real-time Sentiment Dashboard, Fine-tuned Document Q&A Bot, and Object Detection for Autonomous Systems.'
      },
      {
        id: 'res-aiml-4',
        title: 'ML Interview Questions',
        type: 'Interview Prep',
        description: 'Top 50 core Machine Learning, Math, and Model Architecture interview questions for tech roles.',
        linkText: 'Practice Questions',
        details: 'Covers Bias-Variance Tradeoff, Gradient Descent Variants, Transformer Self-Attention Math, Overfitting mitigation, and System Design for ML.'
      }
    ],
    events: [
      {
        id: 'evt-aiml-1',
        title: 'Building LLM Agents Hands-on Workshop',
        date: 'Oct 28, 2026',
        time: '5:00 PM IST',
        location: 'Live Zoom Stream',
        description: 'Learn how to build autonomous AI agents using LangChain, CrewAI, and Python with live coding exercises.'
      },
      {
        id: 'evt-aiml-2',
        title: 'Paper Reading Club: Transformers & Vision Models',
        date: 'Nov 05, 2026',
        time: '6:30 PM IST',
        location: 'CampusBridge Discord Server',
        description: 'Interactive discussion dissecting recent breakthrough AI research papers in Generative AI and Multimodal models.'
      }
    ]
  },
  {
    id: 'cloud',
    name: 'Cloud Computing',
    icon: Cloud,
    membersCount: 1840,
    membersDisplay: '1.8k',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    accentBg: 'bg-blue-500',
    description: 'Master cloud infrastructure, AWS, GCP, Azure, DevOps pipelines, Docker containers, and Kubernetes orchestration.',
    discussions: [
      {
        id: 'disc-cloud-1',
        title: 'AWS Certified Solutions Architect Associate vs Cloud Practitioner — Which to take first?',
        author: 'Rohan Gupta',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80',
        role: 'Student (MCA)',
        time: '1 hour ago',
        replies: 14,
        views: 185,
        content: 'If you already have basic Linux and networking knowledge, can you skip Cloud Practitioner and jump straight to Solutions Architect Associate?'
      },
      {
        id: 'disc-cloud-2',
        title: 'Deploying production multi-node Kubernetes clusters on AWS EKS using Terraform',
        author: 'Sarah Jenkins',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80',
        role: 'Alumni (DevOps Lead)',
        time: '5 hours ago',
        replies: 27,
        views: 340,
        content: 'Here is a breakdown of provisioning VPCs, IAM Roles for Service Accounts (IRSA), ingress controllers, and Helm charts with zero downtime.'
      },
      {
        id: 'disc-cloud-3',
        title: 'Best Terraform practices for modular Infrastructure as Code (IaC) in multi-cloud setups',
        author: 'Kevin Zhang',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&q=80',
        role: 'Mentor (Cloud Architect)',
        time: '3 days ago',
        replies: 19,
        views: 290,
        content: 'Structuring state files, using remote backends with S3 + DynamoDB locking, and organizing reusable Terraform modules across teams.'
      }
    ],
    members: [
      { id: 'mem-cloud-1', name: 'Vikram Sethi', role: 'Mentor', title: 'Senior Cloud Architect at AWS', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80' },
      { id: 'mem-cloud-2', name: 'Emily Watson', role: 'Alumni', title: 'DevOps Lead at HashiCorp', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80' },
      { id: 'mem-cloud-3', name: 'Aarav Sharma', role: 'Student', title: 'Cloud Engineering Intern', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80' },
      { id: 'mem-cloud-4', name: 'Lisa Wang', role: 'Student', title: 'AWS Certified Developer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80' }
    ],
    resources: [
      {
        id: 'res-cloud-1',
        title: 'AWS Beginner Roadmap',
        type: 'Roadmap',
        description: 'Zero to Cloud Architect step-by-step learning path covering EC2, S3, IAM, VPC, Lambda, and CloudWatch.',
        linkText: 'Explore Roadmap',
        details: 'Learn fundamental cloud concepts, security practices, networking subnets, auto-scaling groups, and serverless architectures.'
      },
      {
        id: 'res-cloud-2',
        title: 'Docker Cheat Sheet',
        type: 'Guide',
        description: 'Essential commands, multi-stage Dockerfiles, networking, volumes, and Docker Compose syntax.',
        linkText: 'Read Cheat Sheet',
        details: 'Includes image optimization tricks, container security scanning, environment variables, and Docker Compose stack configuration.'
      },
      {
        id: 'res-cloud-3',
        title: 'Cloud Interview Questions',
        type: 'Interview Prep',
        description: 'AWS, GCP, Cloud Security, and High-Availability System Architecture questions.',
        linkText: 'Practice Questions',
        details: 'Covers High Availability, Disaster Recovery (RTO/RPO), Load Balancer health checks, S3 storage tiers, and IAM policy evaluation.'
      },
      {
        id: 'res-cloud-4',
        title: 'DevOps Learning Resources',
        type: 'Learning',
        description: 'Complete hands-on guides for GitHub Actions, Jenkins, Ansible, Terraform, and Kubernetes.',
        linkText: 'Access Resources',
        details: 'Set up automated CI/CD pipelines, containerize microservices, deploy to Kubernetes clusters, and manage infrastructure with code.'
      }
    ],
    events: [
      {
        id: 'evt-cloud-1',
        title: 'AWS Serverless & Lambda Architecture Masterclass',
        date: 'Oct 30, 2026',
        time: '4:00 PM IST',
        location: 'Google Meet',
        description: 'Architecting scalable, event-driven applications without managing servers using AWS Lambda, API Gateway & DynamoDB.'
      },
      {
        id: 'evt-cloud-2',
        title: 'Kubernetes In-Production Hands-on Lab',
        date: 'Nov 12, 2026',
        time: '7:00 PM IST',
        location: 'CampusBridge Live Lab',
        description: 'Practical session covering pod autoscaling, ingress controllers, Secrets management, and zero-downtime rolling updates.'
      }
    ]
  },
  {
    id: 'web-dev',
    name: 'Web Development',
    icon: Code,
    membersCount: 3250,
    membersDisplay: '3.2k',
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    accentBg: 'bg-orange-500',
    description: 'Build modern full-stack web applications, master Next.js, React, Node.js, Web Animation, and modern UI engineering.',
    discussions: [
      {
        id: 'disc-web-1',
        title: 'Next.js 15 App Router Server Actions vs REST API Routes — When to use which?',
        author: 'Dev Patel',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
        role: 'Full Stack Engineer',
        time: '40 mins ago',
        replies: 31,
        views: 420,
        content: 'Server actions simplify form submissions and mutation logic, but when building public APIs for mobile apps, standard route handlers are still necessary.'
      },
      {
        id: 'disc-web-2',
        title: 'TailwindCSS v4 vs CSS Modules — Developer Experience & Build Performance',
        author: 'Jessica Taylor',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        role: 'Student (Frontend Lead)',
        time: '4 hours ago',
        replies: 45,
        views: 610,
        content: 'Tailwind v4 with Rust-powered Lightning CSS compiler is blazing fast. How are you handling custom theme tokens in your projects?'
      },
      {
        id: 'disc-web-3',
        title: 'State Management in 2026: Zustand vs Redux Toolkit vs React Query (TanStack Query)',
        author: 'Arjun Nair',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
        role: 'Alumni (Frontend Architect)',
        time: '1 day ago',
        replies: 29,
        views: 380,
        content: 'For 95% of web apps, combining TanStack Query for server state and Zustand for lightweight local UI state eliminates complex boilerplate.'
      }
    ],
    members: [
      { id: 'mem-web-1', name: 'Rahul Verma', role: 'Mentor', title: 'Staff Frontend Architect at Vercel', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80' },
      { id: 'mem-web-2', name: 'Tanvi Mehra', role: 'Alumni', title: 'Full Stack Developer at Stripe', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80' },
      { id: 'mem-web-3', name: 'Chris Evans', role: 'Student', title: 'MERN Stack Developer', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80' },
      { id: 'mem-web-4', name: 'Meera Joshi', role: 'Student', title: 'React & UI Animation Enthusiast', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80' }
    ],
    resources: [
      {
        id: 'res-web-1',
        title: 'React Roadmap',
        type: 'Roadmap',
        description: 'Modern Frontend Mastery path covering React 19, Hooks, Server Components, Next.js, and TypeScript.',
        linkText: 'Explore Roadmap',
        details: 'Step-by-step progression from DOM fundamentals and Modern JS to React Server Components, state management, performance tuning, and SSR/SSG.'
      },
      {
        id: 'res-web-2',
        title: 'JavaScript Guide',
        type: 'Guide',
        description: 'Deep dive into ES6+ features, Event Loop, Closures, Promises, Async/Await, and V8 engine internals.',
        linkText: 'Read Guide',
        details: 'Master prototype inheritance, asynchronous programming paradigms, memory leaks detection, DOM mutation, and web workers.'
      },
      {
        id: 'res-web-3',
        title: 'MERN Stack Resources',
        type: 'Learning',
        description: 'Complete hands-on guide for MongoDB, Express.js, React, and Node.js backend development.',
        linkText: 'Access Resources',
        details: 'Build REST APIs, JWT authentication, Mongoose schemas, CORS handling, middleware design, and deployment on Vercel & Render.'
      },
      {
        id: 'res-web-4',
        title: 'Web Project Ideas',
        type: 'Projects',
        description: '10 high-impact full-stack web project ideas with architectural diagrams & feature specs.',
        linkText: 'View Projects',
        details: 'Projects include Real-time Collaborative Code Editor, E-Commerce Platform with Stripe, SaaS Analytics Dashboard, and Social Media Feed.'
      }
    ],
    events: [
      {
        id: 'evt-web-1',
        title: 'Full-Stack Web Dev Bootcamp: Next.js & Tailwind',
        date: 'Oct 26, 2026',
        time: '6:00 PM IST',
        location: 'Live Stream',
        description: 'Build and deploy a real-time web application live from scratch using Next.js 15, TailwindCSS, and Prisma ORM.'
      },
      {
        id: 'evt-web-2',
        title: 'Web Performance Optimization & Core Web Vitals',
        date: 'Nov 08, 2026',
        time: '5:30 PM IST',
        location: 'Zoom Workshop',
        description: 'Practical techniques for code-splitting, image optimization, LCP/CLS fixes, and achieving 100 Lighthouse performance scores.'
      }
    ]
  },
  {
    id: 'cyber-security',
    name: 'Cyber Security',
    icon: Shield,
    membersCount: 1120,
    membersDisplay: '1.1k',
    color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    accentBg: 'bg-red-500',
    description: 'Explore ethical hacking, network defense, application security, penetration testing, cryptography, and CTF competitions.',
    discussions: [
      {
        id: 'disc-sec-1',
        title: 'Top CTF platforms for beginners in 2026 — HackTheBox vs TryHackMe?',
        author: 'Kabir Mehta',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80',
        role: 'Student (InfoSec)',
        time: '2 hours ago',
        replies: 16,
        views: 210,
        content: 'TryHackMe offers guided learning paths which are great for learning fundamentals, whereas HackTheBox is excellent for realistic machine exploitation.'
      },
      {
        id: 'disc-sec-2',
        title: 'Understanding SQL Injection & XSS vulnerabilities in modern Web Frameworks',
        author: 'Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80',
        role: 'Alumni (Penetration Tester)',
        time: '6 hours ago',
        replies: 21,
        views: 305,
        content: 'Even with ORMs and modern UI frameworks, improper sanitization in raw queries or dynamic HTML rendering still exposes applications to severe attacks.'
      },
      {
        id: 'disc-sec-3',
        title: 'How to prepare for OSCP certification alongside college coursework?',
        author: 'Siddharth Das',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
        role: 'Security Scholar',
        time: '2 days ago',
        replies: 38,
        views: 490,
        content: 'A structured 6-month study routine spending 2 hours daily on Proving Grounds labs and active directory exploitation techniques.'
      }
    ],
    members: [
      { id: 'mem-sec-1', name: 'Capt. Sameer Roy', role: 'Mentor', title: 'Principal Security Analyst at Palo Alto', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80' },
      { id: 'mem-sec-2', name: 'Natalie Brooks', role: 'Alumni', title: 'Penetration Tester at CrowdStrike', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80' },
      { id: 'mem-sec-3', name: 'Ishan Kapoor', role: 'Student', title: 'Bug Bounty Hunter & Ethical Hacker', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80' },
      { id: 'mem-sec-4', name: 'Chloe Bennett', role: 'Student', title: 'InfoSec Researcher', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80' }
    ],
    resources: [
      {
        id: 'res-sec-1',
        title: 'Cyber Security Roadmap',
        type: 'Roadmap',
        description: 'Ethical Hacker & Security Specialist learning path from Networking Basics to Advanced Exploitation.',
        linkText: 'Explore Roadmap',
        details: 'Covers Linux CLI, Networking (OSI model, Wireshark), Web Security (OWASP Top 10), Reverse Engineering, and Network Penetration Testing.'
      },
      {
        id: 'res-sec-2',
        title: 'Ethical Hacking Resources',
        type: 'Guide',
        description: 'Penetration Testing Tools & Methodology Cheat Sheet (Nmap, Burp Suite, Metasploit).',
        linkText: 'Read Cheat Sheet',
        details: 'Command reference for Nmap port scanning, Burp Suite intruder attack vectors, Hydra brute-forcing, and Privilege Escalation scripts.'
      },
      {
        id: 'res-sec-3',
        title: 'CTF Practice',
        type: 'Practice',
        description: 'Beginner to Advanced Capture The Flag Challenge Guide & Write-up repository.',
        linkText: 'Practice CTF',
        details: 'Hands-on practice in Cryptography decoding, Reverse Engineering binaries, Web Exploitation, Forensic analysis, and Steganography.'
      },
      {
        id: 'res-sec-4',
        title: 'Security Interview Questions',
        type: 'Interview Prep',
        description: 'Top Application & Network Security questions asked in Security Analyst interviews.',
        linkText: 'Practice Questions',
        details: 'Covers Symmetric vs Asymmetric Encryption, TLS/SSL Handshake, Buffer Overflow mechanics, CORS vs CSRF, and Incident Response steps.'
      }
    ],
    events: [
      {
        id: 'evt-sec-1',
        title: 'Live Capture The Flag (CTF) Tournament',
        date: 'Nov 02, 2026',
        time: '2:00 PM IST',
        location: 'Online Platform',
        description: 'Compete in jeopardy-style web exploitation, reverse engineering, and cryptography security challenges for prizes.'
      },
      {
        id: 'evt-sec-2',
        title: 'Web Application Security Audit Workshop',
        date: 'Nov 15, 2026',
        time: '6:00 PM IST',
        location: 'CampusBridge Discord',
        description: 'Hands-on vulnerability scanning using Burp Suite Professional and manual payload injection techniques.'
      }
    ]
  },
  {
    id: 'ui-ux',
    name: 'UI/UX Design',
    icon: Layout,
    membersCount: 1530,
    membersDisplay: '1.5k',
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    accentBg: 'bg-pink-500',
    description: 'Craft intuitive user experiences, design interfaces, master Figma, wireframing, design systems, and user research.',
    discussions: [
      {
        id: 'disc-ui-1',
        title: 'Design Systems in Figma: Variables vs Component Variants — How do you structure design tokens?',
        author: 'Maya Lin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        role: 'Product Designer',
        time: '1 hour ago',
        replies: 12,
        views: 175,
        content: 'Figma variables make light/dark mode switching seamless, but structuring primitive vs semantic color tokens requires careful planning.'
      },
      {
        id: 'disc-ui-2',
        title: 'How to conduct effective user research with limited budget & small sample sizes',
        author: 'Daniel Lee',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
        role: 'Student (UX Research)',
        time: '8 hours ago',
        replies: 19,
        views: 260,
        content: 'Usability testing with just 5 users can reveal over 80% of usability flaws. Here is a lightweight 5-step test script template.'
      },
      {
        id: 'disc-ui-3',
        title: 'Portfolio Review Thread: Share your Figma/Behance case studies for feedback!',
        author: 'Rhea Sen',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80',
        role: 'Alumni (Lead UX Designer)',
        time: '1 day ago',
        replies: 42,
        views: 530,
        content: 'Post your portfolio links below! I will be reviewing case study problem statements, wireframe iterations, and final UI prototypes.'
      }
    ],
    members: [
      { id: 'mem-ui-1', name: 'Natasha Fernandez', role: 'Mentor', title: 'Lead Product Designer at Figma', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80' },
      { id: 'mem-ui-2', name: 'Leo Vance', role: 'Alumni', title: 'Senior UX Architect at Airbnb', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80' },
      { id: 'mem-ui-3', name: 'Aaliyah Khan', role: 'Student', title: 'UI Designer & Figma Educator', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80' },
      { id: 'mem-ui-4', name: 'Ben Carter', role: 'Student', title: 'Product Design Student', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80' }
    ],
    resources: [
      {
        id: 'res-ui-1',
        title: 'UI/UX Roadmap',
        type: 'Roadmap',
        description: 'Product Design & UX Research Mastery Guide from Wireframing to Interactive Prototyping.',
        linkText: 'Explore Roadmap',
        details: 'Covers Design Thinking, User Persona Creation, Information Architecture, Wireframing, High-Fidelity UI, Micro-interactions, and Usability Testing.'
      },
      {
        id: 'res-ui-2',
        title: 'Figma Resources',
        type: 'Guide',
        description: 'Figma Auto-Layout, Variables, Tokens, and Component Architecture Master Guide.',
        linkText: 'Read Guide',
        details: 'Master responsive auto-layout constraints, component property variants, interactive prototype triggers, and design system documentation.'
      },
      {
        id: 'res-ui-3',
        title: 'Design Challenges',
        type: 'Practice',
        description: 'Daily UI Challenges & Real-World Product Briefs to build a standout portfolio.',
        linkText: 'View Challenges',
        details: 'Includes briefs like Redesigning a Banking Dashboard for Seniors, E-Commerce Checkout Flow, Mobile Fitness Tracker, and SaaS Onboarding.'
      },
      {
        id: 'res-ui-4',
        title: 'Portfolio Guide',
        type: 'Portfolio',
        description: 'How to structure UI/UX Case Studies that impress design recruiters and land interviews.',
        linkText: 'Read Guide',
        details: 'Learn how to articulate problem definitions, user research findings, low-fidelity wireframe iterations, final visual designs, and measurable metrics.'
      }
    ],
    events: [
      {
        id: 'evt-ui-1',
        title: 'Figma Auto-Layout & Design Tokens Workshop',
        date: 'Oct 29, 2026',
        time: '4:30 PM IST',
        location: 'Figma Live Session',
        description: 'Build scalable design component libraries with responsive auto-layout constraints and multi-brand design tokens.'
      },
      {
        id: 'evt-ui-2',
        title: 'UI/UX Portfolio Audit Live Stream',
        date: 'Nov 10, 2026',
        time: '7:00 PM IST',
        location: 'YouTube Live',
        description: 'Get your product design portfolio case studies reviewed live by senior UX leads from Airbnb and Figma.'
      }
    ]
  },
  {
    id: 'dsa',
    name: 'Data Structures (DSA)',
    icon: Users,
    membersCount: 4500,
    membersDisplay: '4.5k',
    color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    accentBg: 'bg-green-500',
    description: 'Master data structures, algorithms, problem-solving patterns, dynamic programming, and technical coding interview prep.',
    discussions: [
      {
        id: 'disc-dsa-1',
        title: 'How to master Dynamic Programming patterns systematically without memorizing solution code?',
        author: 'Varun Malhotra',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
        role: 'Student (SDE Aspirant)',
        time: '30 mins ago',
        replies: 52,
        views: 780,
        content: 'Break down DP into standard patterns: 0/1 Knapsack, Unbounded Knapsack, Longest Common Subsequence, Matrix Chain Multiplication, and DP on Trees.'
      },
      {
        id: 'disc-dsa-2',
        title: 'Graph Algorithms: BFS vs DFS application matrix for shortest path & cycle detection',
        author: 'Grace Liu',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80',
        role: 'Alumni (SDE-2 at Microsoft)',
        time: '3 hours ago',
        replies: 33,
        views: 440,
        content: 'Use BFS for unweighted shortest path and level-order traversal; use DFS for topological sort, cycle detection in directed graphs, and connected components.'
      },
      {
        id: 'disc-dsa-3',
        title: 'LeetCode 75 vs Striver SDE Sheet — Which is optimal for 3-month preparation?',
        author: 'Harsh Vardhan',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80',
        role: 'Competitive Programmer',
        time: '1 day ago',
        replies: 68,
        views: 920,
        content: 'Striver SDE Sheet provides broader coverage of core data structures, whereas LeetCode 75 is great for quick revision before coding interviews.'
      }
    ],
    members: [
      { id: 'mem-dsa-1', name: 'Amitav Ghosh', role: 'Mentor', title: 'Staff Engineer at Google', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80' },
      { id: 'mem-dsa-2', name: 'Sneha Reddy', role: 'Alumni', title: 'SDE-2 at Microsoft', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80' },
      { id: 'mem-dsa-3', name: 'Rohan Kulkarni', role: 'Student', title: 'Candidate Master on Codeforces', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80' },
      { id: 'mem-dsa-4', name: 'Priyansh Saxena', role: 'Student', title: 'Competitive Programmer', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80' }
    ],
    resources: [
      {
        id: 'res-dsa-1',
        title: 'DSA Roadmap',
        type: 'Roadmap',
        description: 'Complete 6-Month Data Structures & Algorithms Blueprint from Arrays to Advanced Graphs & DP.',
        linkText: 'Explore Roadmap',
        details: 'Covers Time/Space Complexity (Big O), Arrays, Linked Lists, Stacks, Queues, Binary Search, Trees, Graphs, Tries, Heaps, and Dynamic Programming.'
      },
      {
        id: 'res-dsa-2',
        title: 'Coding Problems',
        type: 'Practice',
        description: 'Top 150 Must-Do LeetCode & Coding Interview Problems curated by FAANG Engineers.',
        linkText: 'View Problems',
        details: 'Categorized problem sets covering Two Pointers, Sliding Window, Fast & Slow Pointers, Monotonic Stack, Backtracking, and Binary Tree Traversal.'
      },
      {
        id: 'res-dsa-3',
        title: 'Interview Questions',
        type: 'Interview Prep',
        description: 'FAANG Coding & Algorithmic Rounds Guide with optimal C++, Java, and Python solutions.',
        linkText: 'Practice Questions',
        details: 'Covers how to communicate algorithmic thought process during technical interviews, dry-running edge cases, and optimizing time complexity.'
      },
      {
        id: 'res-dsa-4',
        title: 'Competitive Programming Resources',
        type: 'Practice',
        description: 'Codeforces & CodeChef Problem Solving Strategies, Template Code & Snippets.',
        linkText: 'Access Resources',
        details: 'Includes Segment Trees, Fenwick Trees, Disjoint Set Union (DSU), Modular Arithmetic, Fast I/O snippets, and Contest Strategy.'
      }
    ],
    events: [
      {
        id: 'evt-dsa-1',
        title: 'Weekend DSA Speed Contest & Solution Discussion',
        date: 'Nov 01, 2026',
        time: '8:00 PM IST',
        location: 'CampusBridge Contest Arena',
        description: 'Timed 90-minute coding contest followed by live video solution walkthroughs for all 4 algorithmic problems.'
      },
      {
        id: 'evt-dsa-2',
        title: 'Systematic Dynamic Programming Breakdown',
        date: 'Nov 14, 2026',
        time: '6:00 PM IST',
        location: 'Zoom Masterclass',
        description: 'Master memoization vs tabulation, state transitions, space optimization, and top DP interview questions.'
      }
    ]
  }
]
