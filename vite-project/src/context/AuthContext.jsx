import { createContext, useContext, useState, useEffect } from 'react'
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null) // 'user' or 'owner'

  // SIGNUP: creates user in Auth and stores role in Firestore
  async function signup(email, password, displayName, role = 'user') {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    if (displayName) {
      await updateProfile(user, { displayName })
    }

    // Store role in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName: displayName || '',
      email,
      role
    })

    setUserRole(role)
    return userCredential
  }

  // LOGIN
  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Fetch role from Firestore
    const docRef = doc(db, 'users', user.uid)
    const docSnap = await getDoc(docRef)
    const role = docSnap.exists() ? docSnap.data().role : 'user'
    setUserRole(role)

    return userCredential
  }

  function logout() {
    setUserRole(null)
    return signOut(auth)
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  // Keep track of auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        const docRef = doc(db, 'users', user.uid)
        const docSnap = await getDoc(docRef)
        setUserRole(docSnap.exists() ? docSnap.data().role : 'user')
      } else {
        setUserRole(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userRole,
    setUserRole,
    signup,
    login,
    logout,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
