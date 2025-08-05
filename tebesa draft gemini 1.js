import React, { useState, useEffect, createContext, useContext } from 'react';

// Context for managing global state like user authentication and UI theme
const AppContext = createContext();

const AppProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [theme, setTheme] = useState({
        primaryColor: '#F0D4D4',
        secondaryColor: '#C2B9B0',
        headlineFont: 'Playfair Display',
        bodyFont: 'Open Sans',
    });
    const [currentPage, setCurrentPage] = useState('login'); // login, profile, matches, chat, settings

    // Firebase configuration and initialization (simulated for web)
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        // Simulate Firebase initialization and authentication
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

        // Mock Firebase functions for web simulation
        const initializeApp = (config) => ({
            name: 'mockApp',
            options: config,
        });
        const getFirestore = (app) => ({
            // Mock Firestore methods
            collection: (name) => ({
                doc: (id) => ({
                    get: async () => {
                        // Ensure mock data includes all profile fields, especially photos and interests
                        const mockProfileData = {
                            id,
                            name: 'Mock User',
                            age: 30,
                            location: 'Addis Ababa, Ethiopia',
                            bio: 'Passionate about art, hiking, and exploring new cultures. Seeking a genuine connection.',
                            interests: ['Art', 'Hiking', 'Reading', 'Cooking', 'Travel'],
                            photos: [
                                'https://placehold.co/150x150/F0D4D4/FFFFFF?text=Profile+Pic+1',
                                'https://placehold.co/150x150/C2B9B0/FFFFFF?text=Profile+Pic+2',
                            ],
                        };
                        return {
                            exists: true,
                            data: () => mockProfileData,
                        };
                    },
                    set: async (data) => console.log('Mock setDoc:', data),
                    update: async (data) => console.log('Mock updateDoc:', data),
                }),
                add: async (data) => console.log('Mock addDoc:', data),
            }),
            // Mock onSnapshot for real-time updates
            onSnapshot: (query, callback) => {
                const mockData = {
                    docs: [{
                        id: 'mockDoc1',
                        data: () => ({ message: 'Hello!', senderId: 'mockUser1', timestamp: Date.now() })
                    }]
                };
                callback(mockData);
                return () => console.log('Mock onSnapshot detached');
            }
        });
        const getAuth = (app) => ({
            // Mock Auth methods
            signInWithCustomToken: async (auth, token) => {
                console.log('Mock signInWithCustomToken:', token);
                setUserId('mockAuthUser123');
                setIsAuthenticated(true);
                return { user: { uid: 'mockAuthUser123' } };
            },
            signInAnonymously: async (auth) => {
                console.log('Mock signInAnonymously');
                setUserId('mockAnonymousUser456');
                setIsAuthenticated(true);
                return { user: { uid: 'mockAnonymousUser456' } };
            },
            onAuthStateChanged: (auth, callback) => {
                // Simulate auth state change after a short delay
                setTimeout(() => {
                    const user = userId ? { uid: userId } : null;
                    callback(user);
                    setIsAuthReady(true);
                }, 100);
                return () => console.log('Mock onAuthStateChanged detached');
            },
            currentUser: { uid: userId } // Mock current user
        });

        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestoreDb);
        setAuth(firebaseAuth);

        const unsubscribe = firebaseAuth.onAuthStateChanged(firebaseAuth, async (user) => {
            if (user) {
                setUserId(user.uid);
                setIsAuthenticated(true);
            } else {
                // Attempt to sign in anonymously if no user is found
                try {
                    const __initial_auth_token = typeof window !== 'undefined' && window.__initial_auth_token;
                    if (__initial_auth_token) {
                        await firebaseAuth.signInWithCustomToken(firebaseAuth, __initial_auth_token);
                    } else {
                        await firebaseAuth.signInAnonymously(firebaseAuth);
                    }
                    setUserId(firebaseAuth.currentUser?.uid || crypto.randomUUID());
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error("Firebase authentication error:", error);
                    // Fallback to a random UUID if anonymous sign-in also fails
                    setUserId(crypto.randomUUID());
                }
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        isAuthenticated,
        setIsAuthenticated,
        theme,
        currentPage,
        setCurrentPage,
        db,
        auth,
        userId,
        isAuthReady
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Tailwind CSS classes for common styles
const styles = {
    container: 'min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-pink-50 to-rose-100 font-body',
    card: 'bg-white p-6 rounded-xl shadow-lg w-full max-w-md text-center',
    button: 'bg-pink-300 text-white px-6 py-3 rounded-full shadow-md hover:bg-pink-400 transition duration-300 ease-in-out font-semibold text-lg',
    input: 'w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200',
    header: 'text-4xl font-headline text-gray-800 mb-6',
    subHeader: 'text-2xl font-headline text-gray-700 mb-4',
    paragraph: 'text-gray-600 mb-4',
    profileImage: 'w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-pink-200',
    chatBubbleSender: 'bg-pink-200 text-gray-800 p-3 rounded-lg max-w-[70%] self-end mb-2',
    chatBubbleReceiver: 'bg-gray-200 text-gray-800 p-3 rounded-lg max-w-[70%] self-start mb-2',
    navButton: 'flex-1 py-3 text-center text-gray-600 hover:text-pink-500 transition-colors duration-200',
    navButtonActive: 'flex-1 py-3 text-center text-pink-500 border-b-2 border-pink-500 font-semibold',
};

// Login/Registration Page
const AuthScreen = () => {
    const { setIsAuthenticated, setCurrentPage, theme } = useContext(AppContext);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAuth = () => {
        // Simulate authentication
        setIsAuthenticated(true);
        setCurrentPage('profile');
    };

    return (
        <div className={`${styles.container} ${theme.bodyFont}`}>
            <div className={styles.card}>
                <h1 className={styles.header} style={{ fontFamily: theme.headlineFont }}>
                    {isLogin ? 'Welcome Back' : 'Join TEBESA'}
                </h1>
                <p className={styles.paragraph}>
                    {isLogin ? 'Sign in to find your soulmate.' : 'Create your account and start your journey.'}
                </p>
                <input
                    type="email"
                    placeholder="Email"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button className={styles.button} onClick={handleAuth}>
                    {isLogin ? 'Login' : 'Register'}
                </button>
                <p className="mt-4 text-gray-500">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <span
                        className="text-pink-500 cursor-pointer hover:underline"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Register' : 'Login'}
                    </span>
                </p>
                <div className="mt-6">
                    <button className={`${styles.button} bg-blue-500 hover:bg-blue-600`}>
                        Sign in with Google
                    </button>
                </div>
            </div>
        </div>
    );
};

// Navigation Bar
const NavBar = () => {
    const { currentPage, setCurrentPage } = useContext(AppContext);

    const navItems = [
        { name: 'Profile', page: 'profile' },
        { name: 'Matches', page: 'matches' },
        { name: 'Chat', page: 'chat' },
        { name: 'Settings', page: 'settings' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg flex justify-around border-t border-gray-200 z-50">
            {navItems.map((item) => (
                <button
                    key={item.page}
                    className={currentPage === item.page ? styles.navButtonActive : styles.navButton}
                    onClick={() => setCurrentPage(item.page)}
                >
                    {item.name}
                </button>
            ))}
        </nav>
    );
};

// Profile Page
const ProfileScreen = () => {
    const { theme, userId, isAuthReady, db } = useContext(AppContext);
    const [profile, setProfile] = useState({
        name: 'Jane Doe',
        age: 30,
        location: 'Addis Ababa, Ethiopia',
        bio: 'Passionate about art, hiking, and exploring new cultures. Seeking a genuine connection.',
        interests: ['Art', 'Hiking', 'Reading', 'Cooking', 'Travel'],
        photos: [
            'https://placehold.co/150x150/F0D4D4/FFFFFF?text=Profile+Pic+1',
            'https://placehold.co/150x150/C2B9B0/FFFFFF?text=Profile+Pic+2',
        ],
    });

    useEffect(() => {
        if (isAuthReady && db && userId) {
            const fetchProfile = async () => {
                try {
                    const userDocRef = db.collection(`artifacts/${__app_id}/users/${userId}/profiles`).doc(userId);
                    const docSnap = await userDocRef.get();
                    if (docSnap.exists) {
                        // Ensure photos is an array, default to empty array if not present
                        const fetchedData = docSnap.data();
                        setProfile({
                            ...fetchedData,
                            photos: fetchedData.photos || [], // Ensure photos is always an array
                            interests: fetchedData.interests || [] // Ensure interests is always an array
                        });
                    } else {
                        // If no profile exists, create a default one
                        await userDocRef.set(profile);
                    }
                } catch (error) {
                    console.error("Error fetching or setting profile:", error);
                }
            };
            fetchProfile();
        }
    }, [isAuthReady, db, userId]); // Added profile to dependency array to ensure default profile is used if needed

    return (
        <div className={`${styles.container} ${theme.bodyFont} pb-20`}>
            <div className={styles.card}>
                <h1 className={styles.header} style={{ fontFamily: theme.headlineFont }}>
                    My Profile
                </h1>
                {/* Conditionally render profile image only if photos array exists and has elements */}
                {profile.photos && profile.photos.length > 0 && (
                    <img src={profile.photos[0]} alt="Profile" className={styles.profileImage} />
                )}
                <h2 className={styles.subHeader} style={{ fontFamily: theme.headlineFont }}>
                    {profile.name}, {profile.age}
                </h2>
                <p className={styles.paragraph}>{profile.location}</p>
                <p className={styles.paragraph}>{profile.bio}</p>
                <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Interests:</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                        {profile.interests && profile.interests.map((interest, index) => (
                            <span key={index} className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm">
                                {interest}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Photos:</h3>
                    <div className="flex justify-center gap-2">
                        {profile.photos && profile.photos.map((photo, index) => (
                            <img key={index} src={photo} alt={`Gallery ${index}`} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                        ))}
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">User ID: {userId}</p>
            </div>
        </div>
    );
};

// Matches Page
const MatchesScreen = () => {
    const { theme } = useContext(AppContext);
    const [matches, setMatches] = useState([
        { id: 1, name: 'John', age: 32, compatibility: 92, image: 'https://placehold.co/150x150/C2B9B0/FFFFFF?text=John' },
        { id: 2, name: 'Sarah', age: 29, compatibility: 88, image: 'https://placehold.co/150x150/F0D4D4/FFFFFF?text=Sarah' },
        { id: 3, name: 'Michael', age: 35, compatibility: 85, image: 'https://placehold.co/150x150/C2B9B0/FFFFFF?text=Michael' },
    ]);

    return (
        <div className={`${styles.container} ${theme.bodyFont} pb-20`}>
            <div className={styles.card}>
                <h1 className={styles.header} style={{ fontFamily: theme.headlineFont }}>
                    Your Matches
                </h1>
                {matches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {matches.map((match) => (
                            <div key={match.id} className="bg-pink-50 p-4 rounded-lg shadow-sm flex flex-col items-center">
                                <img src={match.image} alt={match.name} className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-pink-200" />
                                <h3 className="text-xl font-semibold text-gray-800">{match.name}, {match.age}</h3>
                                <p className="text-gray-600">Compatibility: {match.compatibility}%</p>
                                <button className="mt-3 bg-pink-400 text-white px-4 py-2 rounded-full text-sm hover:bg-pink-500 transition-colors">
                                    View Profile
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={styles.paragraph}>No new matches yet. Keep exploring!</p>
                )}
            </div>
        </div>
    );
};

// Chat Page
const ChatScreen = () => {
    const { theme, userId, isAuthReady, db } = useContext(AppContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [currentChatUser, setCurrentChatUser] = useState({ id: 'match123', name: 'Alex' });

    // Simulate real-time chat with Firestore onSnapshot
    useEffect(() => {
        if (isAuthReady && db && userId && currentChatUser.id) {
            const chatCollectionPath = `artifacts/${__app_id}/public/data/chats`;
            const q = db.collection(chatCollectionPath);

            const unsubscribe = db.onSnapshot(q, (snapshot) => {
                const fetchedMessages = [];
                snapshot.docs.forEach(doc => {
                    fetchedMessages.push({ id: doc.id, ...doc.data() });
                });
                // Simple sorting for display purposes (in a real app, you'd query with orderBy)
                setMessages(fetchedMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)));
            }, (error) => {
                console.error("Error listening to chat messages:", error);
            });

            return () => unsubscribe();
        }
    }, [isAuthReady, db, userId, currentChatUser.id]);

    const handleSendMessage = async () => {
        if (newMessage.trim() === '') return;

        if (db && userId) {
            try {
                const chatCollectionPath = `artifacts/${__app_id}/public/data/chats`;
                await db.collection(chatCollectionPath).add({
                    text: newMessage,
                    senderId: userId,
                    receiverId: currentChatUser.id, // For a multi-user chat, this would be more complex
                    timestamp: Date.now(),
                });
                setNewMessage('');
            } catch (error) {
                console.error("Error sending message:", error);
            }
        } else {
            console.warn("Firestore or userId not ready to send message.");
        }
    };

    return (
        <div className={`${styles.container} ${theme.bodyFont} pb-20`}>
            <div className={`${styles.card} flex flex-col h-[60vh]`}>
                <h1 className={styles.header} style={{ fontFamily: theme.headlineFont }}>
                    Chat with {currentChatUser.name}
                </h1>
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-lg mb-4 flex flex-col">
                    {messages.length === 0 && (
                        <p className="text-center text-gray-500">Start a conversation!</p>
                    )}
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={msg.senderId === userId ? styles.chatBubbleSender : styles.chatBubbleReceiver}
                        >
                            {msg.text}
                        </div>
                    ))}
                </div>
                <div className="flex">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        className={`${styles.input} flex-1 mr-2`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button className={styles.button} onClick={handleSendMessage}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

// Settings Page
const SettingsScreen = () => {
    const { theme } = useContext(AppContext);

    return (
        <div className={`${styles.container} ${theme.bodyFont} pb-20`}>
            <div className={styles.card}>
                <h1 className={styles.header} style={{ fontFamily: theme.headlineFont }}>
                    Settings
                </h1>
                <div className="text-left">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Account Settings</h2>
                    <ul className="list-disc list-inside mb-4 text-gray-600">
                        <li>Edit Profile</li>
                        <li>Change Password</li>
                        <li>Manage Subscriptions</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Notification Preferences</h2>
                    <ul className="list-disc list-inside mb-4 text-gray-600">
                        <li>New Matches</li>
                        <li>New Messages</li>
                        <li>Promotions</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Privacy</h2>
                    <ul className="list-disc list-inside mb-4 text-gray-600">
                        <li>Privacy Policy</li>
                        <li>Terms of Service</li>
                    </ul>

                    <button className={`${styles.button} bg-red-400 hover:bg-red-500 mt-4`}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main App Component
const App = () => {
    const { isAuthenticated, currentPage } = useContext(AppContext);

    return (
        <div className="relative">
            {isAuthenticated ? (
                <>
                    {currentPage === 'profile' && <ProfileScreen />}
                    {currentPage === 'matches' && <MatchesScreen />}
                    {currentPage === 'chat' && <ChatScreen />}
                    {currentPage === 'settings' && <SettingsScreen />}
                    <NavBar />
                </>
            ) : (
                <AuthScreen />
            )}
        </div>
    );
};

export default function TebesaApp() {
    return (
        <AppProvider>
            <App />
        </AppProvider>
    );
}
