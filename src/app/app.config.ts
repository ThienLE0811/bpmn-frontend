import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import vi from '@angular/common/locales/vi';
import { provideNzI18n, vi_VN } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  PlusOutline,
  EditOutline,
  DeleteOutline,
  CheckCircleOutline,
  SearchOutline,
  SaveOutline,
  CloseOutline,
  UploadOutline,
  DownloadOutline,
  FileImageOutline,
  UndoOutline,
  RedoOutline,
  ZoomInOutline,
  ZoomOutOutline,
  FileTextOutline,
  TableOutline,
  DashboardOutline,
  SettingOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  BranchesOutline,
  ControlOutline,
  InfoCircleOutline,
  ApartmentOutline,
  AppstoreOutline,
  InboxOutline,
  FileSearchOutline,
  DeploymentUnitOutline,
  TagOutline,
  ClockCircleOutline,
  CodeOutline,
  FileDoneOutline,
  ExclamationCircleOutline,
  QuestionCircleOutline,
  WarningOutline,
} from '@ant-design/icons-angular/icons';

import { routes } from './app.routes';

registerLocaleData(vi);

const icons = [
  PlusOutline,
  EditOutline,
  DeleteOutline,
  CheckCircleOutline,
  SearchOutline,
  SaveOutline,
  CloseOutline,
  UploadOutline,
  DownloadOutline,
  FileImageOutline,
  UndoOutline,
  RedoOutline,
  ZoomInOutline,
  ZoomOutOutline,
  FileTextOutline,
  TableOutline,
  DashboardOutline,
  SettingOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  BranchesOutline,
  ControlOutline,
  InfoCircleOutline,
  ApartmentOutline,
  AppstoreOutline,
  InboxOutline,
  FileSearchOutline,
  DeploymentUnitOutline,
  TagOutline,
  ClockCircleOutline,
  CodeOutline,
  FileDoneOutline,
  ExclamationCircleOutline,
  QuestionCircleOutline,
  WarningOutline,
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    provideNzI18n(vi_VN),
    provideNzIcons(icons),
  ],
};
