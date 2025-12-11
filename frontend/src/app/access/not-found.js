import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white font-serif">
            <section className="py-10">
                <div className="container mx-auto px-4">
                    <div className="flex justify-center">
                        <div className="w-full max-w-4xl">
                            <div className="text-center">
                                {/* 404 Background Section */}
                                <div
                                    className="relative h-150 bg-center bg-no-repeat bg-cover mb-8"
                                    style={{
                                        backgroundImage: "url('https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif')"
                                    }}
                                >
                                    <div className="absolute inset-0 flex items-start justify-center">
                                        <h1
                                            className="text-8xl font-bold text-black relative z-10"
                                            style={{ textShadow: '0 6px 20px rgba(0,0,0,0.45)' }}
                                        >
                                            404
                                        </h1>
                                    </div>
                                </div>

                                {/* Content Box */}
                                <div className="mt-[-125px] relative z-20">
                                    <h3 className="text-3xl font-bold mb-4 text-gray-800">
                                        Look like you're lost
                                    </h3>

                                    <p className="text-gray-600 mb-6 text-lg">
                                        The page you are looking for is under maintenance!
                                    </p>

                                    <Link
                                        href="/"
                                        className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded transition-colors duration-200 no-underline"
                                    >
                                        Go to Home
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
