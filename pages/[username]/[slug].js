import styles from '../../styles/Post.module.css';
import { auth, getUserWithUsername, postToJSON, firestore } from '../../lib/firebase';
import PostContent from '../../components/PostContent';
import AuthCheck from '../../components/AuthCheck';
import HeartButton from '../../components/HeartButton';

import Link from 'next/link';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import MetaTags from '../../components/MetaTags';
import { UserContext } from '../../lib/context';
import { useContext } from 'react';

export async function getStaticProps({ params }) {
    const { username, slug } = params; // URL parameters

    const userDoc = await getUserWithUsername(username);

    let post;
    let path;

    if (userDoc) {
        const postRef = userDoc.ref.collection('posts').doc(slug);
        post = postToJSON(await postRef.get());

        path = postRef.path;
    }

    return {
        props: { post, path },
        revalidate: 5000, // 5 seconds
    };
}

// Telling next which pages to render 
export async function getStaticPaths() {
    // Improve this using Admin SDK to select empty docs - get all posts
    const snapshot = await firestore.collectionGroup('posts').get();

    const paths = snapshot.docs.map((doc) => {
        const { slug, username } = doc.data();
        return {
            params: { username, slug },
        };
    });

    return {
        // must be in this format:
        // paths: [
        //     { params: { username, slug }}
        // ],
        paths,
        // when page has not been redered yet, it tells next to fallback to regular SSR
        fallback: 'blocking',
    };
}

export default function Post(props) {
    const postRef = firestore.doc(props.path);
    const [realtimePost] = useDocumentData(postRef);

    const post = realtimePost || props.post;

    const { user: currentUser } = useContext(UserContext);

    return (
        <main className={styles.container}>
            <MetaTags title="Post Page" />

            <section>
                <PostContent post={post} />
            </section>

            <aside className="card">
                <p>
                    <strong>{post.heartCount || 0} 🤍</strong>
                </p>

                <AuthCheck fallback={
                    <Link href="/enter">
                        <button>💗 Sign Up</button>
                    </Link>
                
                }>
                    <HeartButton postRef={postRef} />
                </AuthCheck>
            </aside>

        </main>
    );
}