const AuthLayout = ({
    children
}: {
    children: React.ReactNode
}) => {
    return (
        <div className="min-h-screen flex">
            {/* Left decorative panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center p-12 relative overflow-hidden">
                {/* Background circles */}
                <div className="absolute top-[-80px] left-[-80px] w-[350px] h-[350px] rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-[-80px] right-[-80px] w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-3xl" />
                <div className="relative z-10 text-center text-white">
                    <div className="text-5xl mb-6">🚀</div>
                    <h1 className="text-4xl font-bold mb-4 tracking-tight">Ucentric</h1>
                    <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
                        Manage your projects, track issues, and collaborate with your team — all in one place.
                    </p>
                    <div className="mt-10 flex flex-col gap-4 text-left">
                        {[
                            { icon: "📋", text: "Kanban board & sprint management" },
                            { icon: "💬", text: "Team discussions with @mentions" },
                            { icon: "📊", text: "Project analytics & insights" },
                        ].map((item) => (
                            <div key={item.text} className="flex items-center gap-3 text-slate-300">
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-sm">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right content panel */}
            <div className="flex flex-1 items-center justify-center bg-background p-8">
                {children}
            </div>
        </div>
    );
}

export default AuthLayout;
