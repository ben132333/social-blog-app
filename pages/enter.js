import { auth, firestore, googleAuthProvider } from '../lib/firebase';
import { UserContext } from '../lib/context';
import { useUserData } from '../lib/hooks';
import { useState, useEffect } from 'react';
import debounce from 'lodash.debounce';
import { useCallback } from 'react';



export default function EnterPage(props) {
    const { user, username } = useUserData(UserContext)

    return (
        <>
            <h1>Sign up to join our community!</h1>

            {
                user ? 
                !username ? <UsernameForm /> : <SignOutButton />
                : <SignInButton />
            }
        </>
    );
}

function SignInButton() {
    const signInWithGoogle = async () => {
        await auth.signInWithPopup(googleAuthProvider);
    };

    return(
        <>
            <button className="btn-google" onClick={signInWithGoogle}>
                <img src={'/google.png'} /> Sign in with Google
            </button>
        </>
    );
}

function SignOutButton() {
    return(
        <>  
            {/* removes json web token stored on the browser to manage authentication */}
            <button onClick={() => auth.signOut()}>Sign Out</button>;
        </>
    );
}

function UsernameForm() {
    const [formValue, setFormValue] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [loading, setLoading] = useState(false);

    const { user, username } = useUserData(UserContext);

    const onSubmit = async (e) => {
        e.preventDefault();

        // Create refs for both documents
        const userDoc = firestore.doc(`users/${user.uid}`);
        const usernameDoc = firestore.doc(`usernames/${formValue}`);

        // Commit both docs together as a batch write
        const batch = firestore.batch();
        batch.set(userDoc, {
            username: formValue,
            photoURL: user.photoURL,
            displayName: user.displayName
        });
        batch.set(usernameDoc, { uid: user.uid });

        await batch.commit();
    }

    useEffect(() => {
        checkUsername(formValue);
    }, [formValue]);

    const onChange = (e) => {
        const val = e.target.value.toLowerCase();
        const regex = /^[a-z0-9_]{3,15}$/;

        if(val.length < 3) {
            setFormValue(val);
            setLoading(false);
            setIsValid(false);
        }

        if(regex.test(val)) {
            setFormValue(val);
            setLoading(true);
            setIsValid(false);
        }
    };

    const checkUsername = useCallback(debounce(async (username) => {
        if (username.length >= 3) {
            const ref = firestore.doc(`usernames/${username}`);
            const { exists } = await ref.get();
            console.log('Firestore read executed!');
            setIsValid(!exists);
            setLoading(false);
        }
    }, 500), 
    []
    );

    return(
        !username && (
            <>
            <h3>Choose Username</h3>
            <form onSubmit={onSubmit}>
                <input name="username" placeholder="username" value={formValue} onChange={onChange} />

                <UserNameMessage username={formValue} isValid={isValid} loading={loading} />

                <button type="submit" className="btn-green" disabled={!isValid}>
                    Pick
                </button>

                <h3>Debug State</h3>
                <div>
                    Username: {formValue}
                    <br />
                    Loading: {loading.toString()}
                    <br />
                    Username Valid: {isValid.toString()}
                    <br />
                </div>
            </form>
            </>
        )
    );
}

function UserNameMessage({ username, isValid, loading}) {
    if (loading) {
        return <p>Checking...</p>;
    } else if (isValid) {
        return <p className="text-success">{username} is available!</p>;
    } else if (username && !isValid) {
        return <p className="text-danger">That username is taken!</p>;
    } else {
        return <p></p>;
    }
}
