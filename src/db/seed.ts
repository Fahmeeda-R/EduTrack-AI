import type { AiRubricResult, SubmittedFileItem } from './schema.ts';

export const BRAND_LOGO_URL =
  'https://lh3.googleusercontent.com/aida/ALJJyrDxEsk5c7_PJ0LdWSzJxwhu_UsEoewJEay6tiUwTpGROzE_l-jB8oazlIc2AkY6LvKcCg7C6ZsUvKtmtItfl1Z70JgeEhaYnN8kiPFoz97ta1yB7SKkZ43TNvlMn9MYXBTMhK5WCMOse_BI7Y0wX-3p0wYYRrBzG--TJmASL_v25BnhPd4FKEArVRERhn5LHPeeEuIWqdAKZ4y6WvkhoHbJESHaDzERBqkmz3oPrrGl';

export const STUDENT_AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuApT8gIAV6A9YzjljdkKano1XTRiF6cj-wcz89Lh8fC0eXb2ugtF5TnCJviw4eBc8u2oTJvD0zEP0OlxUZZjFVTSmkdEwNcrHXE5VnNloQB38g9Tj32slBa5JAKM7ioTBVsRYw23JKOVHDwtyzyeJF9U4djGlrPLol0E3G9zKZfpU-z1NQCmAuZWvJ6XVj67rhN1FGgl9cT1-I0N2wiUskPRAQj2EmuNl1MRhYIBes3';

export const PROF_VANCE_AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuADioINO0qKN0nJDB6Y0W01dafsALHOfj2xNlFWCsooChRvNjy0CNYdgfzAB8O8RxTCcvCi43rWaJ3Lz9_CfYTCex-cAExgMjj4yX4Oq1j4xbLbQqPQKkXfHwb7EF-vfHSKXgVmw8vPJSkFyzWt3ph4NlI-8XzDvpmckL77qFv_1At4TLRAAhAvrf2hZbF880IHFW5O9zwKApOPJv3ZA389SjHCHOo3Ucs8TXuTWSxy';

export const LECTURE_BANNER_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBnwGu-2RdIwftnccIaJfHWi4jW-KuMJBtLvizd1WKpK5d11QW-CstNFPpkV_wM4YPazh9i9PLcVjIiROoHIJZ8GYXHdw0ID64zL9nGcMtpw5W6KmxBHgmQXh690gbK9h-2ontkgwsD1evFRVcUL9lwwVS3_tW3zVIqQsJdoXIAhE5lfrJd-OmLuiUfJqhL4ivupsGDm7DYDCxy4uuTh1X9KbvUCpkcvUlOREDnNqw1';

export const DEFAULT_ASSIGNMENTS_SEED: Array<{
  title: string;
  subtitle: string;
  course: string;
  instructor: string;
  dueDate: string;
  dueLabel: string;
  priority: string;
  status: string;
  progress: number;
  weight: number;
  maxPoints: number;
  gradeScore: number | null;
  gradeLetter: string | null;
  milestoneText: string;
  guidelines: string;
  thumbnailUrl: string | null;
  submittedFiles: SubmittedFileItem[];
  aiRubricResult: AiRubricResult | null;
}> = [
  {
    title: 'Operating Systems: Distributed Process Synchronization & Semaphore Implementation',
    subtitle: 'Kernel concurrency models & deadlock avoidance algorithms',
    course: 'Operating Systems',
    instructor: 'Dr. Marcus Vance (Computer Systems)',
    dueDate: '2024-10-23',
    dueLabel: 'Tomorrow, 11:59 PM',
    priority: 'Urgent',
    status: 'in_progress',
    progress: 65,
    weight: 20,
    maxPoints: 100,
    gradeScore: null,
    gradeLetter: null,
    milestoneText: 'Phase 2: Mutex Lock Implementation',
    guidelines:
      'Implement POSIX threads, counting semaphores, deadlock-free mutex lock hierarchies, and barrier synchronization for high-throughput task worker pools. Include concurrency stress benchmarks and Valgrind memory profiles.',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAiBSd_2gpaqb4GXirpvDdRx5zPGX2XsKBhj1maK_QejKYljXVCqiucVmhwuSb0Erl1E20z-D_m9uAyZomGbD01PqKdAzlILzePkmvdYGZ_Ju4t-5zPnDTZOr2BLocsJBU5fibCPt7eqhx8s4x0bRgvXzk_NygCLTIz62spH2_eMfFLCfp32tm_PT9bbTu5oDCtmjbuM1vgyjrrLgzGZznl7bv4xWprePg13ZYHFPEI',
    submittedFiles: [
      { name: 'process_sync_semaphore.c', size: '3.8 MB', status: 'Ready' },
      { name: 'lab_report_concurrency_benchmarks.pdf', size: '1.4 MB', status: 'Ready' },
    ],
    aiRubricResult: {
      projectedScore: 94,
      gradeLetter: 'Grade A',
      confidence: '98.2%',
      criteria: [
        {
          title: 'Deadlock-free Mutex & Semaphore Logic',
          subtitle: 'Strict locking hierarchy, no race conditions',
          badge: 'Passed (100%)',
          status: 'passed',
        },
        {
          title: 'Thread Concurrency & Test Suite Coverage',
          subtitle: 'Stress test passed 19/20 edge trials; minor spinlock jitter under 64-thread contention.',
          badge: '95%',
          status: 'warning',
        },
        {
          title: 'Technical Documentation & Memory Leak Audit',
          subtitle: 'Valgrind 0-leak clean exit, IEEE benchmark graphs',
          badge: '92%',
          status: 'passed',
        },
        {
          title: 'Academic Integrity Pre-Scan',
          subtitle: 'Global institutional corpus match',
          badge: '100% Original',
          status: 'passed',
        },
      ],
      polishTip:
        'Ensure all POSIX semaphore cleanup handlers call sem_destroy() on early program termination for full memory marks.',
    },
  },
  {
    title: 'Web Technologies: Modern Responsive Frontend with REST API Integration',
    subtitle: 'Component-driven UI, async state management, and WCAG accessibility',
    course: 'Web Technologies',
    instructor: 'Prof. Elena Vance',
    dueDate: '2024-10-24',
    dueLabel: 'Oct 24 (in 3 days)',
    priority: 'Medium',
    status: 'in_progress',
    progress: 40,
    weight: 15,
    maxPoints: 100,
    gradeScore: null,
    gradeLetter: null,
    milestoneText: 'Component checklist',
    guidelines:
      'Build a responsive component architecture consuming REST APIs with optimistic UI state updates, accessible keyboard navigation, and automated Vitest component tests.',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCW-NrVyo1W3SgdpCp1dHP7RYWxbOxLG6WQsmxW1yjJNNJfB37txyAojZJsCBZok2Ba4RKIbsZbEuWof_rw8vzqj08mbCwKehZHZE4VOSFSMXkr33kT4jrLvsbPYccFWoiMz5m-77v8G9y6uVjA3st5gwaUSNIyv_JscXD0_ZerBFCufu3XcspKQi9Cfd9vxcIB01Euk3ba338Whf1gE4mqH1_Ls9MOd15FDvSjQb6q',
    submittedFiles: [{ name: 'frontend_rest_client.zip', size: '2.1 MB', status: 'Ready' }],
    aiRubricResult: null,
  },
  {
    title: 'Data Structures: AVL Trees & Graph Search Benchmark',
    subtitle: 'Self-balancing tree rotations and Dijkstra shortest-path complexity analysis',
    course: 'Data Structures',
    instructor: 'Dr. Alan Chen',
    dueDate: '2024-10-27',
    dueLabel: 'Oct 27, 5:00 PM',
    priority: 'High',
    status: 'not_started',
    progress: 0,
    weight: 15,
    maxPoints: 100,
    gradeScore: null,
    gradeLetter: null,
    milestoneText: 'Red-Black Tree & Dijkstra Algorithm',
    guidelines:
      'Implement AVL insertion/deletion rotations in C++ and benchmark Dijkstra vs A* shortest-path performance across 100k-node sparse graphs.',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAM7YJzfkkEw4ndPW5qs5i52MgEYCKNOaiV4bcaYWsXKbEitAzrDceeMJWArITNrHhKCjBzBdBFXyyf80qNb6aKZxdKRxD5WkRhK1Af0JUT4p-W_NQFyE63VVWFZGE7HISOpKmBksd7sCLxayLTL3JplDqwFA6oRp_LMeb6YH2ox9VMdGxoWNJah2STbJPA-1Dt0WnRtht7ooF-DtgRXoQoUTzT6dq73mgouAkhhfS6',
    submittedFiles: [],
    aiRubricResult: null,
  },
  {
    title: 'Java: Spring Boot Microservices Architecture',
    subtitle: 'Service discovery, API gateway routing, and JWT authorization filter',
    course: 'Java',
    instructor: 'Prof. Marcus Vance',
    dueDate: '2024-10-19',
    dueLabel: 'Turned in Oct 19',
    priority: 'Medium',
    status: 'submitted',
    progress: 100,
    weight: 15,
    maxPoints: 100,
    gradeScore: null,
    gradeLetter: null,
    milestoneText: 'Sprint 3: Dependency Injection',
    guidelines:
      'Build Spring Boot microservices with Eureka discovery, Spring Cloud Gateway routing, and stateless JWT security filter chain.',
    thumbnailUrl: null,
    submittedFiles: [{ name: 'spring_microservices_gateway.zip', size: '4.6 MB', status: 'Ready' }],
    aiRubricResult: null,
  },
  {
    title: 'Python: Data Pipeline & Automation Scripts',
    subtitle: 'Pandas ETL pipeline, automated validation and cron-scheduled execution',
    course: 'Python',
    instructor: 'Dr. Priya Nair',
    dueDate: '2024-10-15',
    dueLabel: 'Completed Oct 15',
    priority: 'Normal',
    status: 'graded',
    progress: 100,
    weight: 10,
    maxPoints: 100,
    gradeScore: 98,
    gradeLetter: 'A',
    milestoneText: 'Verified by TA',
    guidelines:
      'Design a resilient Pandas ETL ingestion pipeline with Pydantic schema checks, unit test coverage, and idempotent output artifacts.',
    thumbnailUrl: null,
    submittedFiles: [{ name: 'etl_pipeline_automation.py', size: '640 KB', status: 'Ready' }],
    aiRubricResult: null,
  },
  {
    title: 'DBMS: Relational Query Optimization & Normalization',
    subtitle: 'BCNF decompositions, indexing strategies, and PostgreSQL EXPLAIN plan analysis',
    course: 'DBMS',
    instructor: 'Prof. Hannah Abbott',
    dueDate: '2024-10-30',
    dueLabel: 'Oct 30 (in 9 days)',
    priority: 'Medium',
    status: 'in_progress',
    progress: 50,
    weight: 10,
    maxPoints: 100,
    gradeScore: null,
    gradeLetter: null,
    milestoneText: 'Query benchmarks',
    guidelines:
      'Decompose the campus registrar schema into BCNF, add composite B-Tree indexes, and compare EXPLAIN ANALYZE query latency.',
    thumbnailUrl: null,
    submittedFiles: [{ name: 'bcnf_explain_benchmarks.sql', size: '420 KB', status: 'Ready' }],
    aiRubricResult: null,
  },
  {
    title: 'English: Technical Documentation & Research Writing',
    subtitle: 'IEEE formatting guidelines, peer-review methodology, and abstract synthesis',
    course: 'English',
    instructor: 'Dr. Clara Hughes',
    dueDate: '2024-11-02',
    dueLabel: 'Nov 02, 11:59 PM',
    priority: 'Normal',
    status: 'not_started',
    progress: 0,
    weight: 10,
    maxPoints: 100,
    gradeScore: null,
    gradeLetter: null,
    milestoneText: 'Abstract & Methodology Draft',
    guidelines:
      'Author a 5-page IEEE technical whitepaper synthesizing recent advances in distributed consensus protocols with peer-reviewed citations.',
    thumbnailUrl: null,
    submittedFiles: [],
    aiRubricResult: null,
  },
  {
    title: 'Web Technologies: Full-Stack REST API & Responsive UI',
    subtitle: 'Submitted Oct 18 · Verified by TA',
    course: 'Web Technologies',
    instructor: 'Prof. Elena Vance',
    dueDate: '2024-10-18',
    dueLabel: 'Completed Oct 18',
    priority: 'Normal',
    status: 'graded',
    progress: 100,
    weight: 5,
    maxPoints: 100,
    gradeScore: 96,
    gradeLetter: 'A',
    milestoneText: 'Verified by TA',
    guidelines: 'Full-stack Express & React web dashboard with REST endpoints and responsive layouts.',
    thumbnailUrl: null,
    submittedFiles: [{ name: 'fullstack_rest_app.zip', size: '3.2 MB', status: 'Ready' }],
    aiRubricResult: null,
  },
];

export const DEFAULT_CALENDAR_EVENTS_SEED = [
  {
    title: 'Data Structures: Graph Algorithms & Dynamic Programming',
    course: 'Data Structures',
    date: '2024-10-22',
    timeRange: '09:00 AM – 10:30 AM',
    location: 'Hall B, Room 204',
    eventType: 'lecture',
    badgeText: 'In-Person',
    description: 'Shortest path heuristics, Bellman-Ford, and memoized DP recurrences.',
  },
  {
    title: 'Operating Systems Lab: Semaphore & Thread Scheduling',
    course: 'Operating Systems',
    date: '2024-10-22',
    timeRange: '11:00 AM – 12:30 PM',
    location: 'Tech Wing 12 · Station 4',
    eventType: 'lab',
    badgeText: 'In-Person',
    description: 'POSIX semaphore lab checkoff and deadlock stress testing.',
  },
  {
    title: 'Teacher Consultation: Prof. Vance (Java & Web Tech)',
    course: 'Java',
    date: '2024-10-22',
    timeRange: '02:00 PM – 03:00 PM',
    location: 'Virtual Zoom Link',
    eventType: 'office_hours',
    badgeText: 'Office Hours',
    description: '1-on-1 architecture review for Spring Boot and REST API integration.',
  },
  {
    title: 'DBMS: Normalization & Indexing Practice',
    course: 'DBMS',
    date: '2024-10-22',
    timeRange: '03:00 PM – 05:00 PM',
    location: 'Library Hub · Quiet Pod 03',
    eventType: 'ai_study',
    badgeText: '94% Fit',
    description: 'Scheduled before the midnight deadline. Focus on B-Tree indexing and BCNF decomposition.',
  },
  {
    title: 'Operating Systems: Process Synchronization Lab Due',
    course: 'Operating Systems',
    date: '2024-10-22',
    timeRange: '11:59 PM',
    location: 'Canvas Portal',
    eventType: 'deadline',
    badgeText: 'CRITICAL DEADLINE',
    description: 'Submit GitHub commit hash and Valgrind trace on Canvas portal. Worth 20% Final Grade.',
  },
  {
    title: 'Python: Scripting & API Data Scraping Workshop',
    course: 'Python',
    date: '2024-10-23',
    timeRange: '10:00 AM – 11:30 AM',
    location: 'Alan Turing Auditorium',
    eventType: 'lecture',
    badgeText: 'Workshop',
    description: 'Async HTTP scraping, rate limiting, and Pandas normalization.',
  },
  {
    title: 'Web Technologies: Frontend Frameworks Group',
    course: 'Web Technologies',
    date: '2024-10-23',
    timeRange: '04:00 PM – 05:30 PM',
    location: 'Student Union Room 3',
    eventType: 'study_group',
    badgeText: 'Study Group',
    description: 'Collaborative sprint review with MK, LR, and 4 peers.',
  },
  {
    title: 'DBMS: SQL Relational Schema Report Due',
    course: 'DBMS',
    date: '2024-10-24',
    timeRange: '11:59 PM',
    location: 'PDF Format · Max 10MB',
    eventType: 'deadline',
    badgeText: 'DEADLINE',
    description: 'Complex relational join queries, indexing strategy, and ER diagram documentation.',
  },
];

export const DEFAULT_DOCUMENTS_SEED = [
  {
    name: 'OS_Process_Synchronization_Notes.pdf',
    course: 'Operating Systems',
    fileType: 'pdf',
    sizeBytes: 2516582,
    sizeLabel: '2.4 MB',
    aiSynced: true,
    lastReadLabel: 'Read 2h ago',
    summary: 'Covers POSIX mutexes, counting semaphores, Coffman deadlock conditions, and resource ordering.',
  },
  {
    name: 'Data_Structures_Graph_Algorithms.pdf',
    course: 'Data Structures',
    fileType: 'pdf',
    sizeBytes: 1153433,
    sizeLabel: '1.1 MB',
    aiSynced: true,
    lastReadLabel: 'Read Yesterday',
    summary: 'AVL rotations, Dijkstra, Bellman-Ford, and topological DAG ordering.',
  },
  {
    name: 'Java_Design_Patterns_Cheatsheet.pdf',
    course: 'Java',
    fileType: 'pdf',
    sizeBytes: 870400,
    sizeLabel: '850 KB',
    aiSynced: true,
    lastReadLabel: 'Oct 18',
    summary: 'Dependency Injection, Factory, Builder, and Spring Boot filter chains.',
  },
  {
    name: 'DBMS_Relational_Schema_Design.pdf',
    course: 'DBMS',
    fileType: 'pdf',
    sizeBytes: 3879731,
    sizeLabel: '3.7 MB',
    aiSynced: true,
    lastReadLabel: 'Oct 15',
    summary: '3NF and BCNF normal forms, B+ tree index layout, and query cost estimation.',
  },
  {
    name: 'process_sync_semaphore.c',
    course: 'Operating Systems',
    fileType: 'code',
    sizeBytes: 1249280,
    sizeLabel: '1.2 MB',
    aiSynced: true,
    lastReadLabel: 'Today',
    summary: 'Producer-consumer worker pool using sem_wait, sem_post, and pthread mutex locks.',
  },
  {
    name: 'WebTech_REST_API_Workshop_Transcript.txt',
    course: 'Web Technologies',
    fileType: 'audio',
    sizeBytes: 716800,
    sizeLabel: '700 KB',
    aiSynced: true,
    lastReadLabel: 'Oct 19',
    summary: 'Lecture audio transcript on REST error codes, pagination, and optimistic UI updates.',
  },
];

export const DEFAULT_ANNOUNCEMENTS_SEED = [
  {
    author: 'Academic Affairs',
    department: 'Registrar & Proctoring',
    category: 'urgent',
    tagLabel: 'Urgent Notice',
    title: 'Fall Term 2024 Midterm Proctoring & Room Allocation Schedule',
    body: 'Seat distributions and assigned exam supervisors have been finalized. Please verify your hall assignment prior to Monday morning. Attached: Proctoring_Schedule_v3.pdf (1.2 MB).',
    dateLabel: 'Oct 20 · Academic Affairs',
    isPinned: true,
    isBookmarked: false,
    isRsvped: false,
    imageUrl: null,
    metaText: 'Proctoring_Schedule_v3.pdf · 1.2 MB',
  },
  {
    author: 'Dr. Robert Keller',
    department: 'CS Systems Lab',
    category: 'cs',
    tagLabel: 'Infrastructure',
    title: 'AI Lab Server GPU Maintenance Scheduled for Saturday Night',
    body: 'GPU clusters 01-08 will undergo kernel updates from 23:00 to 04:00 UTC. Submit queued jobs ahead of downtime to prevent unexpected job kills.',
    dateLabel: 'Oct 18 · CS Systems Lab',
    isPinned: false,
    isBookmarked: false,
    isRsvped: false,
    imageUrl: null,
    metaText: '23:00 – 04:00 UTC · Nodes Affected: 8',
  },
  {
    author: 'Dept of Computer Science',
    department: 'Dept of Computer Science',
    category: 'official',
    tagLabel: 'Seminar & Keynote',
    title: 'Guest Lecture: Dr. Cynthia Dwork on Differential Privacy in Machine Learning',
    body: 'Pioneering cryptographer Dr. Cynthia Dwork discusses foundational mathematical definitions of individual privacy within algorithmic decision spaces.',
    dateLabel: 'Oct 16 · Turing Memorial Hall',
    isPinned: false,
    isBookmarked: false,
    isRsvped: false,
    imageUrl: LECTURE_BANNER_URL,
    metaText: 'Thursday, Nov 2 · 4:00 PM EST · Turing Memorial Hall & Zoom',
  },
  {
    author: 'University Libraries',
    department: 'Central Campus Facility',
    category: 'official',
    tagLabel: 'Campus Life',
    title: 'Library Extended Hours for Midterms Season',
    body: '24/7 study floor access begins this Friday across Floors 2 through 5. Silent study pods and research workstation reservations are now accessible online via student cards.',
    dateLabel: 'Oct 14 · University Libraries',
    isPinned: false,
    isBookmarked: false,
    isRsvped: false,
    imageUrl: null,
    metaText: 'Open 24/7 · 32 Quiet Pods Active',
  },
  {
    author: 'Sarah Lin (Lead TA)',
    department: 'CS 301 Distributed Systems',
    category: 'exams',
    tagLabel: 'Course Update',
    title: 'TA Office Hours Rescheduled: CS 301 Distributed Systems',
    body: 'Wednesday afternoon hours have moved to Thursday 10:00–12:30 in CS Annex 204 to review the upcoming Raft consensus homework implementation.',
    dateLabel: 'Oct 12 · CS Annex 204',
    isPinned: false,
    isBookmarked: false,
    isRsvped: false,
    imageUrl: null,
    metaText: 'Thu, 10:00 AM – 12:30 PM · CS Annex 204',
  },
];

export const DEFAULT_STUDY_BLOCKS_SEED = [
  {
    title: 'Deep Focus: Operating Systems Process Synchronization',
    course: 'Operating Systems',
    priority: 'High Priority',
    timeRange: '03:00 PM – 04:30 PM',
    durationLabel: '90 min',
    targetText: 'Implement POSIX semaphores & mutex lock hierarchy',
    blockType: 'Deep Flow Block',
    completed: false,
  },
  {
    title: 'Review: Web Technologies REST API & Responsive Layout',
    course: 'Web Technologies',
    priority: 'Medium Priority',
    timeRange: '05:00 PM – 06:00 PM',
    durationLabel: '60 min',
    targetText: 'Component hierarchy & async error handling',
    blockType: 'Rubric attached',
    completed: false,
  },
  {
    title: 'Spaced Repetition: Data Structures Dynamic Programming & Graphs',
    course: 'Data Structures',
    priority: 'Normal',
    timeRange: '08:00 PM – 08:45 PM',
    durationLabel: '45 min',
    targetText: '24 Graph algorithms & tree balancing concepts',
    blockType: 'Anki Synced Deck',
    completed: true,
  },
];

export const DEFAULT_CHAT_MESSAGES_SEED = [
  {
    role: 'user',
    content:
      'Can you explain how counting semaphores differ from binary mutexes in POSIX, and how we eliminate circular wait to prevent deadlock?',
    courseScope: 'Operating Systems',
    codeSnippet: null,
    codeFilename: null,
    timestampLabel: '10:42 AM',
  },
  {
    role: 'assistant',
    content:
      'In Operating Systems concurrency, a **Mutex** enforces strict thread ownership and mutual exclusion (binary state: 0 or 1), whereas a **Counting Semaphore** coordinates shared resource pools across arbitrary processes without ownership constraints:\n\n1. **Mutex Lock (Ownership Semantics)**: Only the thread that acquired the lock (`pthread_mutex_lock`) can release it (`pthread_mutex_unlock`), preventing race conditions on critical sections.\n2. **Counting Semaphore (Signaling)**: Initialized to integer N; `sem_wait()` decrements and blocks when 0, while `sem_post()` increments and unblocks any waiting thread without ownership check.\n3. **Coffman Deadlock Conditions**: Deadlock occurs if all 4 hold simultaneously: (1) Mutual Exclusion, (2) Hold & Wait, (3) No Preemption, and (4) Circular Wait.\n4. **Deadlock Prevention (Resource Ordering)**: Break circular wait by enforcing a strict global total ordering `R_1 < R_2 < ... < R_m`. Every process must acquire resources strictly in increasing index sequence.',
    courseScope: 'Operating Systems',
    codeSnippet: `sem_t empty_slots, full_slots; // Producer-Consumer Sync\n// Initialize with buffer capacity N = 10\nsem_init(&empty_slots, 0, 10);\nsem_init(&full_slots, 0, 0);\nsem_wait(&empty_slots); // wait if buffer full\npthread_mutex_lock(&buffer_mutex); // protect critical buffer\n// Insert data into shared buffer...\npthread_mutex_unlock(&buffer_mutex);\nsem_post(&full_slots); // notify consumer`,
    codeFilename: 'posix_semaphore_sync.c',
    timestampLabel: '10:42 AM',
  },
];
