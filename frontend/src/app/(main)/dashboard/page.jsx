import BrokerStatusBanner from '@/components/dashboard/BrokerStatusBanner';
import HoldingsTable from '@/components/dashboard/HoldingsTable';
import PortfolioSummary from '@/components/dashboard/PortfolioSummary';
import RefreshButton from '@/components/dashboard/RefreshButton';


export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-background text-foreground p-6 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                            Portfolio
                        </h1>
                        <p className="text-gray-500 mt-1">Track your net worth and performance.</p>
                    </div>
                    <RefreshButton />
                </div>

                {/* Broker Status */}
                <BrokerStatusBanner />

                {/* Summary Cards */}
                <PortfolioSummary />

                {/* Holdings */}
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-200">Holdings</h2>
                    <HoldingsTable />
                </section>

            </div>
        </div>
    );
}
