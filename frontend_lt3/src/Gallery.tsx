import React from "react";
import { useParams } from "react-router";
import { Link } from "react-router";

const Gallery: React.FC = () => {
    let { user, id } = useParams();
    const [imageURL, setImageURL] = React.useState<string>(null);
    const [imageAuthor, setImageAuthor] = React.useState<string>("");
    const [imageIds, setImageIds] = React.useState<string[]>([]);
    const [imageDate, setImageDate] = React.useState<string>("");
    const [currentIndex, setCurrentIndex] = React.useState<number>(0);

    async function fetchAllDrawings(){
        const response = await fetch(`/api/get_partner_image_ids?id=${user}`);
        const data = await response.json();
        setImageIds(data);
        return data;
    }

    async function init(){
        const data = await fetchAllDrawings();
        console.log(data);
        if(id === undefined){
            id = data[0];
        }
        if(data.includes(id)){
            setImageURL(`/api/get_image?id=${id}`);
            setCurrentIndex(data.indexOf(id));
            const author_time = await fetch(`/api/get_image_author_time?id=${id}`);
            const author_time_data = await author_time.json();
            setImageAuthor(author_time_data.author);
            const date = new Date(author_time_data.time * 1000);
            setImageDate(`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`);
        }
    }

    React.useEffect(() => {
        init();
    }, [user, id]);

    return (
        <>
            <div className="m-auto w-64 sm:w-128" hidden={!imageURL}>
                <Link to="/" className="p-2 rounded-md bg-white text-black text-2xl">Back</Link>
                <h1 className="text-2xl text-black my-4">Gallery</h1>
                <img src={imageURL} className="w-64 sm:w-128 m-auto" />
                <div className="flex justify-between my-4"> 
                    <Link
                        to={`/gallery/${user}/${imageIds[currentIndex - 1]}`}
                        className={`bg-gray-300 text-gray-600 py-2 px-4 rounded h-fit ${
                        currentIndex === 0 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                        Previous
                    </Link>
                    <div className="text-center text-xl text-black">
                        Image {currentIndex + 1}/{imageIds.length}<br/>
                        Author: {imageAuthor}<br/>
                        Time: {imageDate}
                    </div>
                    <Link
                        to={`/gallery/${user}/${imageIds[currentIndex + 1]}`}
                        className={`bg-gray-300 text-gray-600 py-2 px-4 rounded h-fit ${
                        currentIndex === imageIds.length - 1
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                    >
                        Next
                    </Link>
                    </div>
            </div>
        </>
    );
};

export default Gallery;