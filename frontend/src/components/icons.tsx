import React from 'react';
import {
  ArrowCounterClockwise,
  ArrowLeft as PhArrowLeft,
  ArrowRight as PhArrowRight,
  ArrowSquareOut,
  Bell as PhBell,
  Briefcase as PhBriefcase,
  Buildings,
  CalendarBlank,
  Camera as PhCamera,
  CaretLeft,
  CaretRight,
  ChatCircle,
  Check as PhCheck,
  CircleNotch,
  Clock as PhClock,
  Code,
  CreditCard as PhCreditCard,
  DownloadSimple,
  Eye as PhEye,
  EyeSlash,
  FileText as PhFileText,
  FloppyDisk,
  Image as PhImage,
  Info as PhInfo,
  Laptop as PhLaptop,
  Lightning,
  List,
  ListChecks as PhListChecks,
  ListPlus as PhListPlus,
  Lock as PhLock,
  LockOpen,
  MagnifyingGlass,
  MapPin as PhMapPin,
  MapTrifold,
  Money,
  PaperPlaneTilt,
  PencilSimple,
  Plus as PhPlus,
  Prohibit,
  QrCode as PhQrCode,
  Scan,
  Scroll,
  ShieldCheck as PhShieldCheck,
  SignIn,
  SignOut,
  Stack,
  Trash,
  Tray,
  TrendUp,
  UploadSimple,
  User as PhUser,
  UserCircle,
  UserPlus as PhUserPlus,
  Users as PhUsers,
  Warning,
  X as PhX,
  type Icon,
} from '@phosphor-icons/react';
import { cx } from '../lib/cx';

/**
 * Los íconos de la web: Phosphor en peso duotono, los mismos de la app.
 *
 * Duotono trae dos capas: el trazo, que toma el color del texto que acompaña,
 * y un relleno detrás que se tiñe del azul de marca (ver `.icono-duo` en
 * index.css). Antes eran de Lucide, de línea delgada y sin relleno: genéricos,
 * y sin peso sobre el fondo oscuro.
 *
 * Este archivo es el único que importa Phosphor. Los nombres que exporta son
 * los que ya usaban las páginas (los de Lucide), así el cambio de familia fue
 * cambiar de dónde se importan, no reescribir cada pantalla. `strokeWidth` se
 * acepta y se ignora: Phosphor no tiene grosor variable, tiene pesos.
 */
export interface IconoProps extends Omit<React.SVGProps<SVGSVGElement>, 'ref'> {
  size?: number | string;
  strokeWidth?: number;
}

/** El tipo de cualquiera de estos íconos (el `LucideIcon` de antes). */
export type LucideIcon = React.ForwardRefExoticComponent<IconoProps & React.RefAttributes<SVGSVGElement>>;

function icono(Base: Icon, nombre: string): LucideIcon {
  const Componente = React.forwardRef<SVGSVGElement, IconoProps>(
    ({ size = 16, strokeWidth: _grosor, className, ...rest }, ref) => (
      <Base ref={ref} size={size} weight="duotone" className={cx('icono-duo', className)} {...(rest as object)} />
    )
  );
  Componente.displayName = nombre;
  return Componente;
}

export const AlertTriangle = icono(Warning, 'AlertTriangle');
export const ArrowLeft = icono(PhArrowLeft, 'ArrowLeft');
export const ArrowRight = icono(PhArrowRight, 'ArrowRight');
export const Ban = icono(Prohibit, 'Ban');
export const Banknote = icono(Money, 'Banknote');
export const Bell = icono(PhBell, 'Bell');
export const Briefcase = icono(PhBriefcase, 'Briefcase');
export const Building2 = icono(Buildings, 'Building2');
export const CalendarDays = icono(CalendarBlank, 'CalendarDays');
export const Camera = icono(PhCamera, 'Camera');
export const Check = icono(PhCheck, 'Check');
export const ChevronLeft = icono(CaretLeft, 'ChevronLeft');
export const ChevronRight = icono(CaretRight, 'ChevronRight');
export const Clock = icono(PhClock, 'Clock');
export const Code2 = icono(Code, 'Code2');
export const CreditCard = icono(PhCreditCard, 'CreditCard');
export const Download = icono(DownloadSimple, 'Download');
export const ExternalLink = icono(ArrowSquareOut, 'ExternalLink');
export const Eye = icono(PhEye, 'Eye');
export const EyeOff = icono(EyeSlash, 'EyeOff');
export const FileText = icono(PhFileText, 'FileText');
export const Image = icono(PhImage, 'Image');
export const Inbox = icono(Tray, 'Inbox');
export const Info = icono(PhInfo, 'Info');
export const Laptop = icono(PhLaptop, 'Laptop');
export const Layers = icono(Stack, 'Layers');
export const ListChecks = icono(PhListChecks, 'ListChecks');
export const ListPlus = icono(PhListPlus, 'ListPlus');
export const Loader2 = icono(CircleNotch, 'Loader2');
export const Lock = icono(PhLock, 'Lock');
export const LogIn = icono(SignIn, 'LogIn');
export const LogOut = icono(SignOut, 'LogOut');
export const Map = icono(MapTrifold, 'Map');
export const MapPin = icono(PhMapPin, 'MapPin');
export const Menu = icono(List, 'Menu');
export const MessageCircle = icono(ChatCircle, 'MessageCircle');
export const Pencil = icono(PencilSimple, 'Pencil');
export const Plus = icono(PhPlus, 'Plus');
export const QrCode = icono(PhQrCode, 'QrCode');
export const RotateCcw = icono(ArrowCounterClockwise, 'RotateCcw');
export const Save = icono(FloppyDisk, 'Save');
export const ScanLine = icono(Scan, 'ScanLine');
export const ScrollText = icono(Scroll, 'ScrollText');
export const Search = icono(MagnifyingGlass, 'Search');
export const Send = icono(PaperPlaneTilt, 'Send');
export const ShieldCheck = icono(PhShieldCheck, 'ShieldCheck');
export const Trash2 = icono(Trash, 'Trash2');
export const TrendingUp = icono(TrendUp, 'TrendingUp');
export const Unlock = icono(LockOpen, 'Unlock');
export const Upload = icono(UploadSimple, 'Upload');
export const User = icono(PhUser, 'User');
export const UserPlus = icono(PhUserPlus, 'UserPlus');
export const UserRound = icono(UserCircle, 'UserRound');
export const Users = icono(PhUsers, 'Users');
export const X = icono(PhX, 'X');
export const Zap = icono(Lightning, 'Zap');
