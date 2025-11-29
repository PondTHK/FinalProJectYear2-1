'use client';

import { useSearchParams } from 'next/navigation';
import CompanyOnboardingLayout from '../../../Components/onboarding/company/CompanyOnboardingLayout';
import CompanyInfoTab from '../../../Components/onboarding/company/CompanyInfoTab';
import ContactDetailsTab from '../../../Components/onboarding/company/ContactDetailsTab';

export default function CompanyOnboardingPage() {
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'info';

    const renderTabContent = () => {
        switch (currentTab) {
            case 'info':
                return <CompanyInfoTab />;
            case 'contact':
                return <ContactDetailsTab />;
            default:
                return <CompanyInfoTab />;
        }
    };

    return (
        <CompanyOnboardingLayout>
            {renderTabContent()}
        </CompanyOnboardingLayout>
    );
}
