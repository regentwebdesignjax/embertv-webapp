import Browse from './pages/Browse';
import FilmDetail from './pages/FilmDetail';
import AdminDashboard from './pages/AdminDashboard';
import AdminFilms from './pages/AdminFilms';
import AdminFilmForm from './pages/AdminFilmForm';
import AdminUsers from './pages/AdminUsers';
import RentalSuccess from './pages/RentalSuccess';
import RentalCanceled from './pages/RentalCanceled';
import MyRentals from './pages/MyRentals';
import Profile from './pages/Profile';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminFilmAnalytics from './pages/AdminFilmAnalytics';
import AdminReviews from './pages/AdminReviews';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AdminRentals from './pages/AdminRentals';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Browse": Browse,
    "FilmDetail": FilmDetail,
    "AdminDashboard": AdminDashboard,
    "AdminFilms": AdminFilms,
    "AdminFilmForm": AdminFilmForm,
    "AdminUsers": AdminUsers,
    "RentalSuccess": RentalSuccess,
    "RentalCanceled": RentalCanceled,
    "MyRentals": MyRentals,
    "Profile": Profile,
    "AdminAnalytics": AdminAnalytics,
    "AdminFilmAnalytics": AdminFilmAnalytics,
    "AdminReviews": AdminReviews,
    "PrivacyPolicy": PrivacyPolicy,
    "TermsOfService": TermsOfService,
    "AdminRentals": AdminRentals,
}

export const pagesConfig = {
    mainPage: "Browse",
    Pages: PAGES,
    Layout: __Layout,
};