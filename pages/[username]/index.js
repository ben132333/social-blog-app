import UserProfile from "../../components/UserProfile";
import PostFeed from "../../components/PostFeed";
import { getUserWithUsername } from "../../lib/firebase";
import { postToJSON } from "../../lib/firebase";

export async function getServerSideProps({query}) {
    const {username} = query;

    const userDoc = await getUserWithUsername(username);

    if (!userDoc) {
        return {
            notFound: true,
        };
    }

    // JSON serializable data
    let user = null;
    let posts = null;

    if(userDoc) {
        user = userDoc.data();
        // Get the 5 most recent posts from a user
        const postsQuery = userDoc.ref
            .collection('posts')
            .where('published', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(5);

        posts = (await postsQuery.get()).docs.map(postToJSON);
    }

    return {
        props: {user, posts}, // will be passed to the page component as props
    };
}

export default function UserProfilePage({user, posts}) {
    return (
        <div>
            <UserProfile user={user} />
            <PostFeed posts={posts} />
        </div>
    );
}