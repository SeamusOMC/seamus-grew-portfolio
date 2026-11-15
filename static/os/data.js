/**
 * Everything shown on the monitor comes from this file.
 *
 * To add something, copy an existing entry in the list you want to extend
 * and change the text. Nothing else needs to be edited.
 */
window.PORTFOLIO = {
    name: 'Séamus Grew',
    title: 'Software Engineer',
    tagline: "Software Engineer educated at Queen's University Belfast",

    profile: [
        "Software Engineer educated at Queen's University Belfast with professional experience developing AI-powered applications, enterprise software solutions, cloud-hosted systems and large-scale data processing pipelines.",
        'Experienced across software engineering, data transformation, full-stack development and AI implementation within both professional and academic environments.',
        'I thrive in fast-paced environments and enjoy solving complex technical challenges with real-world impact.',
    ],

    // Short facts shown beside the profile
    highlights: [
        { label: 'Currently', value: 'Software Engineer at LoweConex' },
        { label: 'Previously', value: 'PwC Flying Start Technology Internship' },
        { label: 'Degree', value: "Software Engineering with Digital Technology Partnership, Queen's University Belfast (2:1)" },
    ],

    contact: {
        // Shown in place of an email address and phone number
        note: 'For safety and privacy reasons, my email address and phone number are available on request through LinkedIn.',
        // File in this folder offered as a download
        cv: 'Seamus_Grew_CV.pdf',
        links: [
            { label: 'LinkedIn', url: 'https://www.linkedin.com/in/seamus-grew-ab8623242' },
            // { label: 'GitHub', url: 'https://github.com/your-username' },
        ],
    },

    experience: [
        {
            role: 'Software Engineer',
            company: 'LoweConex',
            dates: 'October 2025 – Present',
            points: [
                'Developing AI-powered quality assurance systems for production use',
                'Building data transformation and validation pipelines for large-scale global datasets',
                'Contributing across the full software development lifecycle in an enterprise environment',
            ],
        },
        {
            role: 'Software Engineer Intern',
            company: 'PwC (Flying Start Technology Internship)',
            dates: '2021 – 2025',
            points: [
                'Delivered internal software solutions in a global enterprise environment using Agile and Scrum methodologies',
                'Built and contributed to AI-powered internal applications',
                'Presented technical updates and project progress to senior stakeholders',
                'Held leadership roles as Year Representative and Social Committee Chairperson',
            ],
        },
        {
            role: 'Customer Team Member',
            company: 'Co-op',
            dates: 'March 2020 – September 2021',
            points: ['Supported customers and store operations in a fast-paced retail environment'],
        },
        {
            role: 'Supervisor',
            company: "Cafolla's Fish & Chip Shop",
            dates: 'August 2018 – March 2020',
            points: ['Supervised staff and managed daily operations in a high-pressure service environment'],
        },
    ],

    // Optional per project: link: 'https://...'
    projects: [
        {
            name: 'AI-Powered Internal Applications',
            description: 'Developed multiple AI-powered internal business applications during professional placements using Agile and Scrum methodologies.',
            tech: ['AI', 'Agile', 'Scrum'],
        },
        {
            name: 'Cloud-Hosted Multi-Layer Application',
            description: 'Designed and built a Kubernetes-based, Dockerised cloud application using Python, Flask, C#, .NET and SQL.',
            tech: ['Kubernetes', 'Docker', 'Python', 'Flask', 'C#', '.NET', 'SQL'],
        },
        {
            name: 'Adaptive Learning Platform',
            description: 'Worked within a team to develop a React and Django web application providing adaptive quizzes for primary school pupils preparing for transfer tests.',
            tech: ['React', 'Django'],
        },
        {
            name: 'Dog Care Management System',
            description: 'Created a bespoke C# and SQL application to digitise and improve database management processes for a dog care company.',
            tech: ['C#', 'SQL'],
        },
        {
            name: 'Vending Machine Software',
            description: 'Developed vending machine software within a team of five using Java.',
            tech: ['Java'],
        },
        {
            name: 'Jukebox Software System',
            description: 'Extended an MP3 player application into a fully functional jukebox system using Java.',
            tech: ['Java'],
        },
        {
            name: 'Text Adventure Game',
            description: 'Collaborated with a team to create a browser-based text adventure game using HTML, CSS and JavaScript.',
            tech: ['HTML', 'CSS', 'JavaScript'],
        },
    ],

    skills: [
        { group: 'Languages', items: ['Python', 'Java', 'C#', 'JavaScript', 'SQL', 'HTML/CSS'] },
        { group: 'Frameworks', items: ['React', 'Django', 'Flask', '.NET'] },
        { group: 'Cloud / DevOps', items: ['Docker', 'Kubernetes', 'CI/CD', 'Git'] },
        { group: 'AI / Data', items: ['LLM integration', 'Prompt Engineering', 'Data pipelines', 'Power BI', 'Alteryx'] },
        { group: 'Methodologies', items: ['Agile', 'Scrum'] },
    ],

    education: [
        { category: 'Degree', qualification: "Software Engineering with Digital Technology Partnership, Queen's University Belfast", result: '2:1 (Second Class Upper)' },
        { category: 'A-Level', qualification: 'System Software Development', result: 'A' },
        { category: 'A-Level', qualification: 'Mathematics', result: 'B' },
        { category: 'A-Level', qualification: 'Physics', result: 'B' },
        { category: 'AS Level', qualification: 'Irish', result: 'A' },
        { category: 'Additional', qualification: 'Fáinne Óir – Coláiste Mhuire', result: 'A' },
    ],

    leadership: [
        'Took part in the 2026 Belfast City Marathon in aid of Air Ambulance NI.',
        'Raised £2,000 for School Aid Romania through self-organised fundraising initiatives and volunteered on-site supporting local communities.',
        'Volunteer IT support provider for a local youth outreach organisation.',
        'Football coach for youth teams.',
        'Captained football teams from youth to senior level, developing leadership and teamwork skills.',
    ],

    interests: [
        'Organised sports (team & individual)',
        'Software Development',
        'Artificial Intelligence',
        'Raspberry Pi projects',
        'PC Building',
    ],

    // What anyone nosy enough to open the .env file on the desktop finds
    envFile: [
        '# Oi! What are you searching for?',
        '# Nothing to see here. Nice try though.',
        
    ],

    // The "My Setup" window appears once this list has entries, for example:
    //   { part: 'Monitor', detail: 'AOC ...' },
    //   { part: 'GPU', detail: '...' },
    setup: [],
};
