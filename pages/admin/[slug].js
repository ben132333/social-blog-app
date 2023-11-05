import MetaTags from '../../components/MetaTags';
import AuthCheck from '../../components/AuthCheck';
import PostFeed from '../../components/PostFeed';
import ImageUploader from '../../components/ImageUploader';

import { firestore, auth, serverTimestamp, postToJSON } from '../../lib/firebase';
import { UserContext } from '../../lib/context';
import { useUserData } from '../../lib/hooks';
import styles from '../../styles/Admin.module.css';

import { useContext, useState } from 'react';
import { useRouter } from 'next/router';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import kebabCase from 'lodash.kebabcase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';


export default function AdminPostsEdit() {
    return (
        <AuthCheck>
            <PostManager />
        </AuthCheck>
    );
}

function PostManager() {
    const [preview, setPreview] = useState(false);
    
    // Fetch document from firestore that user wants to edit
    const router = useRouter();
    const { slug } = router.query;
    const postRef = firestore.collection('users').doc(auth.currentUser.uid).collection('posts').doc(slug);
    
    const [post] = useDocumentData(postRef);

    return (
        <main className={styles.container}>
            {post && (
                <>
                    <section>
                        <h1>{post.title}</h1>
                        <p>ID: {post.slug}</p>
                        <PostForm postRef={postRef} defaultValues={post} preview={preview} />
                    </section>
                    <aside>
                        <h3>Tools</h3>
                        <button onClick={() => setPreview(!preview)}>
                            {preview ? 'Edit' : 'Preview'}
                        </button>
                        <Link href={`/${post.username}/${post.slug}`}>
                            <button className="btn-blue">Live view</button>
                        </Link>
                    </aside>
                </>
            )}
        </main>
    );
}

function PostForm({ defaultValues, postRef, preview }) {
    const { register, handleSubmit, reset, watch, formState, errors } = useForm({ defaultValues, mode: 'onChange' });

    const { isValid, isDirty } = formState;

    const registerArguments = {
        maxLength: { value: 20000, message: 'Must be less than 20k characters' },
        minLength: { value: 6, message: 'Must be at least 6 characters' },
        required: { value: true, message: 'Required' },
    };

    const updatePost = async ({ content, published }) => {
        await postRef.update({
            content,
            published,
            updatedAt: serverTimestamp(),
        });
    
        toast.success('Post updated successfully!');
    }

    return (
        <form onSubmit={handleSubmit(updatePost)}>
            {preview && (
                <div className="card">
                    <ReactMarkdown>{watch('content')}</ReactMarkdown>
                </div>
            )}
            
            <div className={preview ? styles.hidden : styles.controls}>

                <ImageUploader />
                
                <textarea name="content" ref={register(registerArguments)}>
                </textarea>

                {errors.content && <p className="text-danger">{errors.content.message}</p>}

                <fieldset>
                    <input className={styles.checkbox} name="published" type="checkbox" ref={register}  /> Published
                </fieldset>
                
                <button type="submit" className="btn-green" disabled={!isDirty || !isValid}>
                    Save Changes
                </button>

            </div>
        </form>
    );

}