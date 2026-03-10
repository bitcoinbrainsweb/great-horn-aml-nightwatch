/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Admin from './pages/Admin';
import AdminAuditLog from './pages/AdminAuditLog';
import AdminControlLibrary from './pages/AdminControlLibrary';
import AdminIndustries from './pages/AdminIndustries';
import AdminInvitations from './pages/AdminInvitations';
import AdminJurisdictions from './pages/AdminJurisdictions';
import AdminMethodologies from './pages/AdminMethodologies';
import AdminNarratives from './pages/AdminNarratives';
import AdminRiskLibrary from './pages/AdminRiskLibrary';
import AdminRiskProposals from './pages/AdminRiskProposals';
import AdminSuggestions from './pages/AdminSuggestions';
import AdminTestScenarios from './pages/AdminTestScenarios';
import AdminUsers from './pages/AdminUsers';
import ClientDetail from './pages/ClientDetail';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import EngagementDetail from './pages/EngagementDetail';
import Engagements from './pages/Engagements';
import Help from './pages/Help';
import NightwatchVerificationReport from './pages/NightwatchVerificationReport';
import Reports from './pages/Reports';
import ReviewerDashboard from './pages/ReviewerDashboard';
import Tasks from './pages/Tasks';
import VerificationReportA1847 from './pages/VerificationReportA1847';
import VerificationReportA7364 from './pages/VerificationReportA7364';
import VerificationReportB6142 from './pages/VerificationReportB6142';
import VerificationReportM4827 from './pages/VerificationReportM4827';
import LibraryReviewDashboard from './pages/LibraryReviewDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "AdminAuditLog": AdminAuditLog,
    "AdminControlLibrary": AdminControlLibrary,
    "AdminIndustries": AdminIndustries,
    "AdminInvitations": AdminInvitations,
    "AdminJurisdictions": AdminJurisdictions,
    "AdminMethodologies": AdminMethodologies,
    "AdminNarratives": AdminNarratives,
    "AdminRiskLibrary": AdminRiskLibrary,
    "AdminRiskProposals": AdminRiskProposals,
    "AdminSuggestions": AdminSuggestions,
    "AdminTestScenarios": AdminTestScenarios,
    "AdminUsers": AdminUsers,
    "ClientDetail": ClientDetail,
    "Clients": Clients,
    "Dashboard": Dashboard,
    "EngagementDetail": EngagementDetail,
    "Engagements": Engagements,
    "Help": Help,
    "NightwatchVerificationReport": NightwatchVerificationReport,
    "Reports": Reports,
    "ReviewerDashboard": ReviewerDashboard,
    "Tasks": Tasks,
    "VerificationReportA1847": VerificationReportA1847,
    "VerificationReportA7364": VerificationReportA7364,
    "VerificationReportB6142": VerificationReportB6142,
    "VerificationReportM4827": VerificationReportM4827,
    "LibraryReviewDashboard": LibraryReviewDashboard,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};