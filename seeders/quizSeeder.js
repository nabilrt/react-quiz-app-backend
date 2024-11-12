const mongoose = require("mongoose");
const Quiz = require("../models/Quiz"); // Adjust path as necessary
require("dotenv").config();

// Load quiz data
const reactLogo = "https://res.cloudinary.com/ddedulzz1/image/upload/v1731341665/tmtr1di9smi2pgc0rump.svg";
const nextLogo = "https://res.cloudinary.com/ddedulzz1/image/upload/v1731341665/fiu4h4pwtbzemxamjy3g.svg";
const pythonLogo = "https://res.cloudinary.com/ddedulzz1/image/upload/v1731341665/fkt6awdjsspr1tgto0ky.svg";
const djangoLogo = "https://res.cloudinary.com/ddedulzz1/image/upload/v1731341665/bban7vuyygo9knguh86t.svg";

const quiz_data = {
    quizzes: [
        {
            topic: "Next.js",
            info: "Next.js is a React framework that enables functionality like server-side rendering and static site generation for building web applications.",
            logo: nextLogo,
            categories: [
                {
                    category: "General Knowledge",
                    info: "Basics of Next JS for Beginners",
                    questions: [
                        {
                            question: "What type of framework is Next.js?",
                            options: [
                                { answer: "Frontend" },
                                { answer: "Backend" },
                                { answer: "FullStack" },
                                { answer: "None of the above" },
                            ],
                            answer: ["Frontend", "FullStack"],
                        },
                        {
                            question: "Which company maintains Next.js?",
                            options: [
                                { answer: "Facebook" },
                                { answer: "Vercel" },
                                { answer: "Google" },
                                { answer: "Amazon" },
                            ],
                            answer: ["Vercel"],
                        },
                        {
                            question:
                                "What methods of rendering does Next.js support?",
                            options: [
                                { answer: "Server-side Rendering (SSR)" },
                                { answer: "Client-side Rendering (CSR)" },
                                { answer: "Static Site Generation (SSG)" },
                                { answer: "All of the above" },
                            ],
                            answer: ["All of the above"],
                        },
                        {
                            question:
                                "Which Next.js feature enables static optimization for pages?",
                            options: [
                                { answer: "Static Props" },
                                { answer: "Server Components" },
                                { answer: "Automatic Static Optimization" },
                                { answer: "Dynamic Imports" },
                            ],
                            answer: ["Automatic Static Optimization"],
                        },
                    ],
                },
                {
                    category: "Advanced Concepts",
                    info: "Advanced Topics for more of experienced Next JS Developers.",
                    questions: [
                        {
                            question:
                                "Which of these are routing methods in Next.js?",
                            options: [
                                { answer: "File-based routing" },
                                { answer: "App-level routing" },
                                { answer: "API-based routing" },
                                { answer: "Component-level routing" },
                            ],
                            answer: ["File-based routing", "API-based routing"],
                        },
                        {
                            question:
                                "Which hook is essential for data fetching in Next.js?",
                            options: [
                                { answer: "useEffect" },
                                { answer: "getStaticProps" },
                                { answer: "getServerSideProps" },
                                { answer: "fetchData" },
                            ],
                            answer: ["getStaticProps", "getServerSideProps"],
                        },
                        {
                            question:
                                "Which of these are true about dynamic routes in Next.js?",
                            options: [
                                {
                                    answer: "Dynamic routes can be created using brackets in the filename",
                                },
                                {
                                    answer: "Dynamic routes are automatically generated by Next.js",
                                },
                                {
                                    answer: "getStaticPaths is used for pre-rendering dynamic pages",
                                },
                                {
                                    answer: "Dynamic routes can only be used with static pages",
                                },
                            ],
                            answer: [
                                "Dynamic routes can be created using brackets in the filename",
                                "getStaticPaths is used for pre-rendering dynamic pages",
                            ],
                        },
                        {
                            question:
                                "What is the purpose of the 'getStaticPaths' function?",
                            options: [
                                {
                                    answer: "Define dynamic routes to pre-render",
                                },
                                { answer: "Handle static CSS imports" },
                                { answer: "Optimize page load" },
                                { answer: "Manage API requests" },
                            ],
                            answer: ["Define dynamic routes to pre-render"],
                        },
                    ],
                },
            ],
        },
        {
            topic: "Python",
            info: "Python is a versatile high-level programming language known for its readability and support for multiple programming paradigms.",
            logo: pythonLogo,
            categories: [
                {
                    category: "Basics",
                    info: "Basics of Python for Beginners",
                    questions: [
                        {
                            question:
                                "Which data structure can store multiple items in Python?",
                            options: [
                                { answer: "List" },
                                { answer: "Class" },
                                { answer: "Variable" },
                                { answer: "Function" },
                            ],
                            answer: ["List"],
                        },
                        {
                            question: "What does the 'len()' function do?",
                            options: [
                                { answer: "Returns the size of an object" },
                                { answer: "Creates a list" },
                                { answer: "Concatenates strings" },
                                {
                                    answer: "Returns the last element in a list",
                                },
                            ],
                            answer: ["Returns the size of an object"],
                        },
                        {
                            question:
                                "Which operator is used for exponentiation in Python?",
                            options: [
                                { answer: "^" },
                                { answer: "**" },
                                { answer: "exp()" },
                                { answer: "power()" },
                            ],
                            answer: ["**"],
                        },
                        {
                            question: "How do you create a comment in Python?",
                            options: [
                                { answer: "#" },
                                { answer: "//" },
                                { answer: "<!-- -->" },
                                { answer: "/* */" },
                            ],
                            answer: ["#"],
                        },
                    ],
                },
                {
                    category: "Data Science Libraries",
                    info: "Advanced Topics for more of experienced Python Developers.",
                    questions: [
                        {
                            question:
                                "Which libraries are primarily used for data analysis in Python?",
                            options: [
                                { answer: "NumPy" },
                                { answer: "Django" },
                                { answer: "Pandas" },
                                { answer: "Flask" },
                            ],
                            answer: ["NumPy", "Pandas"],
                        },
                        {
                            question:
                                "Which Python library is best suited for creating statistical models?",
                            options: [
                                { answer: "scikit-learn" },
                                { answer: "NumPy" },
                                { answer: "matplotlib" },
                                { answer: "SciPy" },
                            ],
                            answer: ["scikit-learn", "SciPy"],
                        },
                        {
                            question:
                                "Which library is commonly used for creating data visualizations in Python?",
                            options: [
                                { answer: "matplotlib" },
                                { answer: "NumPy" },
                                { answer: "TensorFlow" },
                                { answer: "Pandas" },
                            ],
                            answer: ["matplotlib"],
                        },
                        {
                            question:
                                "Which function in pandas is used to calculate the mean of a DataFrame column?",
                            options: [
                                { answer: "mean()" },
                                { answer: "average()" },
                                { answer: "sum()" },
                                { answer: "mean_column()" },
                            ],
                            answer: ["mean()"],
                        },
                    ],
                },
            ],
        },
        {
            topic: "React",
            info: "React is a JavaScript library developed by Facebook for building user interfaces, especially single-page applications.",
            logo: reactLogo,
            categories: [
                {
                    category: "React Basics",
                    info: "Basics of React for Beginners",
                    questions: [
                        {
                            question:
                                "Which extension is used to write HTML inside JavaScript in React?",
                            options: [
                                { answer: "JSX" },
                                { answer: "HTML5" },
                                { answer: "React HTML" },
                                { answer: "JS5" },
                            ],
                            answer: ["JSX"],
                        },
                        {
                            question:
                                "Which of these are core features of React?",
                            options: [
                                { answer: "Components" },
                                { answer: "Virtual DOM" },
                                { answer: "Real-time database integration" },
                                { answer: "Redux" },
                            ],
                            answer: ["Components", "Virtual DOM"],
                        },
                        {
                            question:
                                "Which React method is used to render elements to the DOM?",
                            options: [
                                { answer: "ReactDOM.render()" },
                                { answer: "ReactDOM.create()" },
                                { answer: "React.createElement()" },
                                { answer: "React.render()" },
                            ],
                            answer: ["ReactDOM.render()"],
                        },
                        {
                            question:
                                "What does React use to track changes in the DOM?",
                            options: [
                                { answer: "Virtual DOM" },
                                { answer: "Real DOM" },
                                { answer: "Shadow DOM" },
                                { answer: "Component Tree" },
                            ],
                            answer: ["Virtual DOM"],
                        },
                    ],
                },
                {
                    category: "React Hooks",
                    info: "One of the Advanced Topics for more of experienced React Developers.",
                    questions: [
                        {
                            question:
                                "Which hooks can be used to handle state in functional components?",
                            options: [
                                { answer: "useState" },
                                { answer: "useEffect" },
                                { answer: "useReducer" },
                                { answer: "useContext" },
                            ],
                            answer: ["useState", "useReducer"],
                        },
                        {
                            question: "What does the 'useEffect' hook do?",
                            options: [
                                { answer: "Fetches data from an API" },
                                {
                                    answer: "Performs side effects in function components",
                                },
                                { answer: "Only handles DOM updates" },
                                { answer: "Updates context" },
                            ],
                            answer: [
                                "Performs side effects in function components",
                            ],
                        },
                        {
                            question:
                                "Which hook would you use to access a context in React?",
                            options: [
                                { answer: "useContext" },
                                { answer: "useState" },
                                { answer: "useEffect" },
                                { answer: "useReducer" },
                            ],
                            answer: ["useContext"],
                        },
                        {
                            question:
                                "How can you manage side effects in a functional component?",
                            options: [
                                { answer: "useState" },
                                { answer: "useEffect" },
                                { answer: "useMemo" },
                                { answer: "useCallback" },
                            ],
                            answer: ["useEffect"],
                        },
                    ],
                },
            ],
        },
        {
            topic: "Django",
            info: "Django is a high-level Python web framework that encourages rapid development and clean, pragmatic design.",
            logo: djangoLogo,
            categories: [
                {
                    category: "Django Basics",
                    info: "Basics of Django for Beginners",
                    questions: [
                        {
                            question: "Which language is Django written in?",
                            options: [
                                { answer: "JavaScript" },
                                { answer: "Python" },
                                { answer: "Ruby" },
                                { answer: "Java" },
                            ],
                            answer: ["Python"],
                        },
                        {
                            question: "What pattern does Django primarily use?",
                            options: [
                                { answer: "MVC" },
                                { answer: "MVT" },
                                { answer: "MVVM" },
                                { answer: "MVP" },
                            ],
                            answer: ["MVT"],
                        },
                        {
                            question:
                                "Which file in Django defines URL routing?",
                            options: [
                                { answer: "views.py" },
                                { answer: "urls.py" },
                                { answer: "models.py" },
                                { answer: "settings.py" },
                            ],
                            answer: ["urls.py"],
                        },
                        {
                            question: "What is the purpose of Django's ORM?",
                            options: [
                                { answer: "Database migrations" },
                                { answer: "Generating HTML" },
                                {
                                    answer: "Mapping database rows to Python objects",
                                },
                                { answer: "Handling user authentication" },
                            ],
                            answer: ["Mapping database rows to Python objects"],
                        },
                    ],
                },
                {
                    category: "Django Advanced",
                    info: "Advanced Topics for more of experienced Django Developers.",
                    questions: [
                        {
                            question:
                                "Which command is used to create a new Django app?",
                            options: [
                                { answer: "django-admin startproject" },
                                { answer: "django-admin startapp" },
                                { answer: "django-admin newapp" },
                                { answer: "django startapp" },
                            ],
                            answer: ["django-admin startapp"],
                        },
                        {
                            question:
                                "What command applies migrations in Django?",
                            options: [
                                { answer: "python manage.py migrate" },
                                { answer: "python manage.py apply" },
                                { answer: "django-admin apply" },
                                { answer: "python manage.py migrateall" },
                            ],
                            answer: ["python manage.py migrate"],
                        },
                        {
                            question: "What is a Django middleware?",
                            options: [
                                {
                                    answer: "A plugin for modifying requests and responses",
                                },
                                {
                                    answer: "A template engine for HTML rendering",
                                },
                                { answer: "A command for database migrations" },
                                { answer: "A type of model in Django" },
                            ],
                            answer: [
                                "A plugin for modifying requests and responses",
                            ],
                        },
                        {
                            question:
                                "Which function renders an HTML template in Django?",
                            options: [
                                { answer: "render()" },
                                { answer: "redirect()" },
                                { answer: "get()" },
                                { answer: "template()" },
                            ],
                            answer: ["render()"],
                        },
                    ],
                },
            ],
        },
    ],
};

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("Connected to MongoDB");

        // Insert quiz data
        const quizPromises = quiz_data.quizzes.map(async (quiz) => {
            return new Quiz(quiz).save();
        });

        await Promise.all(quizPromises);
        console.log("Quiz data successfully seeded!");

        mongoose.connection.close();
    } catch (error) {
        console.error("Error seeding quiz data:", error);
    }
}

seedDatabase();
