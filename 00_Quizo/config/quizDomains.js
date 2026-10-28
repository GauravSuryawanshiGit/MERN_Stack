/**
 * Quiz Domains & Category Catalog Configuration
 * Multi-domain taxonomy supporting Programming, Placement Exams, and General Knowledge.
 */

const QUIZ_DOMAINS = {
    "Programming & CS": {
        id: "programming-cs",
        name: "Programming & Computer Science",
        description: "Core programming languages, algorithms, system engineering, and modern technology stacks.",
        categories: [
            { id: "C", name: "C Programming", subcategories: ["Basics", "Pointers", "Memory Management", "Data Types", "Control Structures"], tags: ["c", "system", "programming"] },
            { id: "C++", name: "C++", subcategories: ["OOP", "STL", "Templates", "Constructors", "Inheritance"], tags: ["cpp", "oops", "stl"] },
            { id: "Java", name: "Java", subcategories: ["Core Java", "OOPs Concepts", "Collections", "Exception Handling", "Multithreading"], tags: ["java", "jvm", "backend"] },
            { id: "Python", name: "Python", subcategories: ["Fundamentals", "Data Structures", "Functions & Lambdas", "Modules & Packages", "File I/O"], tags: ["python", "scripting"] },
            { id: "JavaScript", name: "JavaScript", subcategories: ["ES6+", "Async/Await", "DOM", "Closures & Scope", "Prototypes"], tags: ["javascript", "frontend", "web"] },
            { id: "DSA", name: "Data Structures & Algorithms", subcategories: ["Arrays & Strings", "Linked Lists", "Stacks & Queues", "Trees & Graphs", "Sorting & Searching"], tags: ["dsa", "algorithms", "problem-solving"] },
            { id: "OOP", name: "Object-Oriented Programming", subcategories: ["Encapsulation", "Inheritance", "Polymorphism", "Abstraction", "Design Patterns"], tags: ["oop", "software-design"] },
            { id: "DBMS", name: "DBMS & SQL", subcategories: ["SQL Queries", "Normalization", "ACID Properties", "Indexing", "Transactions"], tags: ["dbms", "sql", "database"] },
            { id: "OS", name: "Operating Systems", subcategories: ["Process Management", "CPU Scheduling", "Deadlocks", "Memory Management", "File Systems"], tags: ["os", "kernel", "systems"] },
            { id: "CN", name: "Computer Networks", subcategories: ["OSI Model", "TCP/IP Suite", "Routing Protocols", "DNS & HTTP", "Network Security"], tags: ["networking", "protocols", "tcp-ip"] },
            { id: "Software Engineering", name: "Software Engineering", subcategories: ["SDLC Models", "Agile & Scrum", "Testing Methodologies", "UML", "CI/CD"], tags: ["se", "agile", "testing"] },
            { id: "COA", name: "Computer Organization & Architecture", subcategories: ["Instruction Sets", "Pipelining", "Cache Memory", "ALU & Control Unit", "Bus Architectures"], tags: ["coa", "hardware"] },
            { id: "Web Development", name: "Web Development", subcategories: ["HTML5 & CSS3", "Responsive Design", "Client-Server Architecture", "HTTP Protocol", "State Management"], tags: ["web", "fullstack"] },
            { id: "REST APIs", name: "REST APIs", subcategories: ["HTTP Methods", "Status Codes", "Authentication & JWT", "Idempotency", "Pagination"], tags: ["api", "rest", "backend"] },
            { id: "Git & GitHub", name: "Git & GitHub", subcategories: ["Commits & Branching", "Merge & Rebase", "Pull Requests", "Conflict Resolution", "Workflows"], tags: ["git", "version-control"] },
            { id: "Cybersecurity", name: "Cybersecurity Fundamentals", subcategories: ["Encryption & Hashing", "Web Vulnerabilities", "Authentication Attacks", "Network Defense", "OWASP Top 10"], tags: ["security", "crypto", "owasp"] },
            { id: "Cloud Computing", name: "Cloud Computing", subcategories: ["IaaS/PaaS/SaaS", "Virtualization", "Cloud Storage", "Serverless", "Security & IAM"], tags: ["cloud", "devops", "aws", "gcp"] },
            { id: "AI & ML", name: "Artificial Intelligence & ML", subcategories: ["Supervised Learning", "Unsupervised Learning", "Evaluation Metrics", "Neural Networks", "NLP"], tags: ["ai", "ml", "data-science"] },
            { id: "Generative AI", name: "Generative AI & RAG", subcategories: ["LLM Fundamentals", "Prompt Engineering", "Embeddings & Vectors", "RAG Architecture", "Fine-Tuning"], tags: ["genai", "llm", "rag"] }
        ]
    },
    "Placements & Exams": {
        id: "placements-exams",
        name: "Competitive Exams & Placements",
        description: "Aptitude, logical reasoning, verbal comprehension, coding MCQs, and technical interview assessments.",
        categories: [
            { id: "Aptitude", name: "Quantitative Aptitude", subcategories: ["Percentages & Profit/Loss", "Time & Work", "Speed, Distance & Time", "Ratio & Proportion", "Averages"], tags: ["math", "aptitude", "quantitative"] },
            { id: "Logical Reasoning", name: "Logical Reasoning", subcategories: ["Number Series", "Blood Relations", "Coding-Decoding", "Syllogisms", "Direction Sense"], tags: ["reasoning", "logic"] },
            { id: "Verbal Ability", name: "Verbal Ability & Comprehension", subcategories: ["Reading Comprehension", "Vocabulary & Synonyms", "Sentence Completion", "Critical Reasoning", "Para Jumbles"], tags: ["verbal", "english"] },
            { id: "English Grammar", name: "English Grammar", subcategories: ["Tenses", "Subject-Verb Agreement", "Prepositions", "Active & Passive Voice", "Error Spotting"], tags: ["grammar", "english"] },
            { id: "Data Interpretation", name: "Data Interpretation", subcategories: ["Bar Graphs", "Pie Charts", "Tables", "Line Charts", "Caselets"], tags: ["di", "charts", "analytics"] },
            { id: "Coding MCQs", name: "Coding MCQs & Output", subcategories: ["Code Output Prediction", "Complexity Analysis", "Recursion Tracing", "Loop Analysis", "Bitwise Manipulation"], tags: ["mcq", "code-tracing", "output"] },
            { id: "Debugging", name: "Debugging Fundamentals", subcategories: ["Off-by-One Errors", "Null Pointer Handling", "Infinite Loops", "Type Mismatches", "Concurrency Bugs"], tags: ["debugging", "troubleshooting"] },
            { id: "Interview Prep", name: "Interview Preparation", subcategories: ["System Design Basics", "Behavioral Scenarios", "Core CS Essentials", "Technical Problem Solving"], tags: ["interview", "campus", "jobs"] },
            { id: "General Computer Awareness", name: "General Computer Awareness", subcategories: ["Hardware & Peripherals", "Operating Systems", "Networking Basics", "Computer History & Abbreviations", "Internet Security"], tags: ["computer-literacy", "general-it"] }
        ]
    },
    "General Knowledge": {
        id: "general-knowledge",
        name: "General Knowledge & Learning",
        description: "National & world history, geography, foundational sciences, mathematics, and financial literacy.",
        categories: [
            { id: "Indian History", name: "Indian History", subcategories: ["Ancient India", "Medieval India", "Modern India & Freedom Movement", "Post-Independence", "Art & Culture"], tags: ["history", "india", "upsc"] },
            { id: "Geography", name: "Geography", subcategories: ["Physical Geography", "Indian Rivers & Landforms", "Climate & Monsoons", "World Geography", "Natural Resources"], tags: ["geography", "earth", "climate"] },
            { id: "General Science", name: "General Science", subcategories: ["Physics Fundamentals", "Chemistry in Everyday Life", "Biology & Human Anatomy", "Space & Astronomy", "Environmental Science"], tags: ["science", "physics", "chemistry", "biology"] },
            { id: "General Knowledge", name: "General Knowledge", subcategories: ["World Landmarks", "International Organizations", "Awards & Honours", "Books & Authors", "Sports & Games"], tags: ["gk", "current-affairs", "trivia"] },
            { id: "Financial Literacy", name: "Basic Financial Literacy", subcategories: ["Banking Essentials", "Budgeting & Savings", "Inflation & Interest Rates", "Investments & Mutual Funds", "Taxes & Digital Payments"], tags: ["finance", "money", "economics"] }
        ]
    }
};

/**
 * Helper: Find domain and category configuration by ID or name
 */
function resolveCategory(categoryName) {
    if (!categoryName) return null;
    const cleanName = categoryName.trim().toLowerCase();

    for (const [domainName, domain] of Object.entries(QUIZ_DOMAINS)) {
        for (const cat of domain.categories) {
            if (
                cat.id.toLowerCase() === cleanName ||
                cat.name.toLowerCase() === cleanName ||
                cat.tags.some(t => t.toLowerCase() === cleanName)
            ) {
                return {
                    domain: domainName,
                    domainId: domain.id,
                    category: cat.id,
                    categoryName: cat.name,
                    subcategories: cat.subcategories,
                    tags: cat.tags
                };
            }
        }
    }

    // Default fallback to Programming & CS if unrecognized
    return {
        domain: "Programming & CS",
        domainId: "programming-cs",
        category: categoryName,
        categoryName: categoryName,
        subcategories: ["General"],
        tags: [categoryName.toLowerCase()]
    };
}

/**
 * Helper: Returns flat list of all active category IDs
 */
function getAllCategoryIds() {
    const list = [];
    for (const domain of Object.values(QUIZ_DOMAINS)) {
        for (const cat of domain.categories) {
            list.push(cat.id);
        }
    }
    return list;
}

module.exports = {
    QUIZ_DOMAINS,
    resolveCategory,
    getAllCategoryIds
};

