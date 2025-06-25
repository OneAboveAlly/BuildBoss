import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
  ShareIcon,
  BookmarkIcon,
  UserIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import PublicLayout from '../components/layout/PublicLayout';
import Layout from '../components/layout/Layout';
import { jobService } from '../services/jobService';
import type { JobOffer } from '../types/job';
import { JOB_CATEGORIES, JOB_TYPES, EXPERIENCE_LEVELS } from '../types/job';
import { useAuth } from '../contexts/AuthContext';

// Fix dla ikon Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Publiczny navbar dla niezalogowanych użytkowników
const PublicHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <span className="text-white font-bold text-lg">🏗️</span>
            </div>
            <h1 className="text-xl font-bold text-primary-600 hidden sm:block">
              SiteBoss
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              Strona główna
            </Link>
            <Link to="/jobs" className="text-primary-600 font-medium">
              Oferty pracy
            </Link>
            <Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
              Logowanie
            </Link>
            <Link 
              to="/register" 
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Rejestracja
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-gray-900 px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Strona główna
              </Link>
              <Link 
                to="/jobs" 
                className="text-primary-600 font-medium px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Oferty pracy
              </Link>
              <Link 
                to="/login" 
                className="text-gray-600 hover:text-gray-900 px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Logowanie
              </Link>
              <Link 
                to="/register" 
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg mx-2 text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Rejestracja
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

// Footer
const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-secondary-900 text-white py-16 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <BuildingOffice2Icon className="h-8 w-8 text-primary-400" />
              <span className="text-2xl font-bold">
                Site<span className="text-primary-400">Boss</span>
              </span>
            </div>
            <p className="text-secondary-300 mb-6 max-w-md">
              Profesjonalne zarządzanie projektami budowlanymi. Planuj, organizuj i realizuj swoje projekty efektywniej niż kiedykolwiek.
            </p>
            <div className="flex space-x-4">
              <a href="mailto:kontakt@siteboss.pl" className="text-secondary-300 hover:text-white transition-colors">
                <EnvelopeIcon className="h-6 w-6" />
              </a>
              <a href="tel:+48123456789" className="text-secondary-300 hover:text-white transition-colors">
                <PhoneIcon className="h-6 w-6" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Produkt</h4>
            <ul className="space-y-2 text-secondary-300">
              <li><Link to="/jobs" className="hover:text-white transition-colors">Oferty pracy</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Cennik</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integracje</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Firma</h4>
            <ul className="space-y-2 text-secondary-300">
              <li><a href="#" className="hover:text-white transition-colors">O nas</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kariera</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kontakt</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-secondary-400 text-sm">
            © 2024 SiteBoss. Wszystkie prawa zastrzeżone.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="/legal/privacy" className="text-secondary-400 hover:text-white text-sm transition-colors">Polityka prywatności</a>
            <a href="/legal/terms" className="text-secondary-400 hover:text-white text-sm transition-colors">Regulamin</a>
            <a href="/legal/gdpr" className="text-secondary-400 hover:text-white text-sm transition-colors">GDPR</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Komponent mapy
interface JobMapProps {
  latitude?: number;
  longitude?: number;
  address: string;
  city: string;
  voivodeship: string;
}

const JobMap: React.FC<JobMapProps> = ({ latitude, longitude, address, city, voivodeship }) => {
  // Domyślne koordynaty dla Polski (centrum)
  const defaultCenter: [number, number] = [52.0693, 19.4803];
  const mapCenter: [number, number] = latitude && longitude ? [latitude, longitude] : defaultCenter;
  const hasCoordinates = latitude && longitude;

  return (
    <div className="w-full h-80 rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={mapCenter}
        zoom={hasCoordinates ? 15 : 6}
        style={{ height: '100%', width: '100%' }}
        className="z-10"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {hasCoordinates && (
          <Marker position={[latitude!, longitude!]}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{address}</p>
                <p className="text-sm text-gray-600">{city}, {voivodeship}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [job, setJob] = useState<JobOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobData = await jobService.getJob(id!);
      setJob(jobData);
    } catch (err: any) {
      console.error('Error loading job:', err);
      setError(err.response?.data?.error || 'Błąd podczas pobierania ogłoszenia');
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'przed chwilą';
    if (diffInHours < 24) return `${diffInHours}h temu`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} dni temu`;
    return date.toLocaleDateString('pl-PL');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Oferta pracy: ${job?.title} w ${job?.company.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Tutaj można dodać toast notification
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // Tutaj można dodać logikę zapisywania
  };

  const handleApply = () => {
    if (!user) {
      navigate('/login', { state: { from: `/jobs/${id}` } });
      return;
    }
    setShowApplicationModal(true);
  };

  // Wybierz odpowiedni layout w zależności od stanu logowania
  const LayoutComponent = user ? Layout : PublicLayout;

  if (loading) {
    return (
      <LayoutComponent>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Ładowanie ogłoszenia...</p>
          </div>
        </div>
      </LayoutComponent>
    );
  }

  if (error || !job) {
    return (
      <LayoutComponent>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Nie znaleziono ogłoszenia
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'Ogłoszenie mogło zostać usunięte lub jest nieaktywne.'}
            </p>
            <Link to="/jobs">
              <Button>
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Powrót do listy ogłoszeń
              </Button>
            </Link>
          </div>
        </div>
      </LayoutComponent>
    );
  }

  const salaryText = job.salaryMin || job.salaryMax 
    ? `${job.salaryMin || 'od'} - ${job.salaryMax || 'do'} ${job.currency || 'PLN'}`
    : 'Wynagrodzenie do uzgodnienia';

  return (
    <LayoutComponent>
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">
              <HomeIcon className="w-4 h-4" />
            </Link>
            <span>/</span>
            <Link to="/jobs" className="hover:text-gray-700">
              Oferty pracy
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{job.title}</span>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/jobs"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Powrót do ogłoszeń
          </Link>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
            >
              <ShareIcon className="w-4 h-4 mr-2" />
              Udostępnij
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
            >
              {isSaved ? (
                <BookmarkSolidIcon className="w-4 h-4 mr-2 text-primary-600" />
              ) : (
                <BookmarkIcon className="w-4 h-4 mr-2" />
              )}
              {isSaved ? 'Zapisane' : 'Zapisz'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {job.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
                <div className="flex items-center">
                  <BuildingOffice2Icon className="w-5 h-5 mr-2" />
                  <span className="font-medium">{job.company.name}</span>
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="w-5 h-5 mr-2" />
                  <span>{job.city}, {job.voivodeship}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="w-5 h-5 mr-2" />
                  <span>{timeAgo(job.createdAt)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {JOB_CATEGORIES[job.category]}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {JOB_TYPES[job.type]}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                  {EXPERIENCE_LEVELS[job.experience]}
                </span>
              </div>
            </div>

            {/* Job details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Szczegóły oferty
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-600 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Wynagrodzenie</div>
                    <div className="font-semibold text-gray-900">{salaryText}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <BriefcaseIcon className="w-6 h-6 text-blue-600 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Typ pracy</div>
                    <div className="font-semibold text-gray-900">{JOB_TYPES[job.type]}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <AcademicCapIcon className="w-6 h-6 text-purple-600 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Doświadczenie</div>
                    <div className="font-semibold text-gray-900">{EXPERIENCE_LEVELS[job.experience]}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Opis stanowiska
                </h3>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              {job.requirements && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Wymagania
                  </h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {job.requirements}
                    </p>
                  </div>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Co oferujemy
                  </h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {job.benefits}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Location and Map */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Lokalizacja
              </h2>
              
              <div className="flex items-center text-gray-600 mb-6">
                <MapPinIcon className="w-5 h-5 mr-2" />
                <span>
                  {job.address ? `${job.address}, ` : ''}{job.city}, {job.voivodeship}
                </span>
              </div>

              {/* Interactive Map */}
              <JobMap
                latitude={job.latitude}
                longitude={job.longitude}
                address={job.address || ''}
                city={job.city}
                voivodeship={job.voivodeship}
              />

              {/* Map fallback link */}
              <div className="mt-4">
                <a
                  href={jobService.getMapUrl(job.latitude, job.longitude, job.city, job.address) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <GlobeAltIcon className="w-4 h-4 mr-2" />
                  Otwórz w Google Maps
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply CTA */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <Button
                onClick={handleApply}
                className="w-full mb-4 bg-primary-600 hover:bg-primary-700"
                size="lg"
              >
                <UserIcon className="w-5 h-5 mr-2" />
                Aplikuj na to stanowisko
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowContactModal(true)}
                className="w-full"
              >
                <EnvelopeIcon className="w-4 h-4 mr-2" />
                Pokaż kontakt
              </Button>
              
              {job.applicationCount !== undefined && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  {job.applicationCount} osób już aplikowało
                </div>
              )}
            </div>

            {/* Company info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                O firmie
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <BuildingOffice2Icon className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="font-medium">{job.company.name}</span>
                </div>
                
                {job.company.description && (
                  <p className="text-gray-600 text-sm">
                    {job.company.description}
                  </p>
                )}
                
                {job.company.website && (
                  <a
                    href={job.company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary-600 hover:text-primary-700 text-sm transition-colors"
                  >
                    <GlobeAltIcon className="w-4 h-4 mr-2" />
                    Odwiedź stronę firmy
                  </a>
                )}
              </div>
            </div>

            {/* Job stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informacje dodatkowe
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Data publikacji:</span>
                  <span className="text-gray-900">{new Date(job.createdAt).toLocaleDateString('pl-PL')}</span>
                </div>
                
                {job.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ważne do:</span>
                    <span className="text-gray-900">{new Date(job.expiresAt).toLocaleDateString('pl-PL')}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Kategoria:</span>
                  <span className="text-gray-900">{JOB_CATEGORIES[job.category]}</span>
                </div>
                
                {job.viewCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Liczba wyświetleń:</span>
                    <span className="text-gray-900 font-medium">{job.viewCount.toLocaleString('pl-PL')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Dane kontaktowe"
      >
        <div className="space-y-4">
          {job.contactEmail && (
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <a 
                  href={`mailto:${job.contactEmail}`}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {job.contactEmail}
                </a>
              </div>
            </div>
          )}
          
          {job.contactPhone && (
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <div className="text-sm text-gray-500">Telefon</div>
                <a 
                  href={`tel:${job.contactPhone}`}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {job.contactPhone}
                </a>
              </div>
            </div>
          )}
          
          {!job.contactEmail && !job.contactPhone && (
            <div className="text-center py-4 text-gray-500">
              Brak dodatkowych danych kontaktowych.
              <br />
              Skontaktuj się przez formularz aplikacji.
            </div>
          )}
        </div>
      </Modal>

      {/* Application Modal */}
      <Modal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        title="Aplikuj na stanowisko"
      >
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Funkcja aplikowania będzie dostępna wkrótce
          </h3>
          <p className="text-gray-600 mb-6">
            Na razie skontaktuj się bezpośrednio z pracodawcą używając danych kontaktowych.
          </p>
          <Button
            onClick={() => {
              setShowApplicationModal(false);
              setShowContactModal(true);
            }}
          >
            Zobacz dane kontaktowe
          </Button>
        </div>
      </Modal>
    </LayoutComponent>
  );
}; 