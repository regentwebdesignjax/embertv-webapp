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
import AdminAnalytics from './pages/AdminAnalytics';
import AdminDashboard from './pages/AdminDashboard';
import AdminFilmAnalytics from './pages/AdminFilmAnalytics';
import AdminFilmForm from './pages/AdminFilmForm';
import AdminFilms from './pages/AdminFilms';
import AdminRentals from './pages/AdminRentals';
import AdminReviews from './pages/AdminReviews';
import AdminUsers from './pages/AdminUsers';
import Browse from './pages/Browse';
import FilmDetail from './pages/FilmDetail';
import Home from './pages/Home';
import MyRentals from './pages/MyRentals';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import RentalCanceled from './pages/RentalCanceled';
import RentalSuccess from './pages/RentalSuccess';
import TermsOfService from './pages/TermsOfService';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAnalytics": AdminAnalytics,
    "AdminDashboard": AdminDashboard,
    "AdminFilmAnalytics": AdminFilmAnalytics,
    "AdminFilmForm": AdminFilmForm,
    "AdminFilms": AdminFilms,
    "AdminRentals": AdminRentals,
    "AdminReviews": AdminReviews,
    "AdminUsers": AdminUsers,
    "Browse": Browse,
    "FilmDetail": FilmDetail,
    "Home": Home,
    "MyRentals": MyRentals,
    "PrivacyPolicy": PrivacyPolicy,
    "Profile": Profile,
    "RentalCanceled": RentalCanceled,
    "RentalSuccess": RentalSuccess,
    "TermsOfService": TermsOfService,
}

export const pagesConfig = {
    mainPage: "Browse",
    Pages: PAGES,
    Layout: __Layout,
};