"use client"

export function Hero() {
    return (
        <section className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                            Encyclopedia Galactica
                        </h1>
                        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                            Explore the vast knowledge of the galaxy. Discover planets, stars, and civilizations across the cosmos.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
