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