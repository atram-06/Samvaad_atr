import React from 'react';

const VideoPlayer = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                    className="w-full h-full"
                    controls
                    src="https://www.w3schools.com/html/mov_bbb.mp4"
                >
                    Your browser does not support the video tag.
                </video>
            </div>
            <div className="mt-4">
                <h1 className="text-2xl font-bold">Big Buck Bunny</h1>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-300 mr-3"></div>
                        <div>
                            <p className="font-bold">Blender Foundation</p>
                            <p className="text-sm text-gray-500">1M subscribers</p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button className="bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200">Like</button>
                        <button className="bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200">Share</button>
                    </div>
                </div>
                <div className="mt-4 bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm">
                        Big Buck Bunny tells the story of a giant rabbit with a heart bigger than himself.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
