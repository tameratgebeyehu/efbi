import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './Layout'
import { AccountPage, AuthProvider, JoinPage, RequireVerifiedUser, SignInPage } from './auth'
import { LearningPage } from './learning'
import {
  AboutPage,
  BlogPage,
  CertificationPage,
  ContactPage,
  CourseDetailPage,
  CoursesPage,
  HomePage,
  NotFoundPage,
  ProgramDetailPage,
  ProgramsPage,
  VerifyPage,
} from './pages'
import './site.css'

export default function SiteApp() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="programs" element={<ProgramsPage />} />
          <Route path="programs/:slug" element={<ProgramDetailPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/ai-foundations" element={<CourseDetailPage />} />
          <Route path="certification" element={<CertificationPage />} />
          <Route path="verify" element={<VerifyPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="join" element={<JoinPage />} />
          <Route path="signin" element={<SignInPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="learn/ai-foundations" element={<RequireVerifiedUser><LearningPage /></RequireVerifiedUser>} />
          <Route path="learn/ai-foundations/:lessonSlug" element={<RequireVerifiedUser><LearningPage /></RequireVerifiedUser>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
