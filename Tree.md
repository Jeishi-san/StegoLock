# File Tree: stegolock

**Generated:** 4/22/2026, 8:50:35 PM
**Root Path:** `c:\Users\USER\Desktop\Final\stegolock`

```
├── 📁 app
│   ├── 📁 Config
│   │   └── 🐘 Constant.php
│   ├── 📁 Console
│   │   └── 📁 Commands
│   │       └── 🐘 TestEncryptDocument.php
│   ├── 📁 Http
│   │   ├── 📁 Controllers
│   │   │   ├── 📁 Auth
│   │   │   │   ├── 🐘 AuthenticatedSessionController.php
│   │   │   │   ├── 🐘 ConfirmablePasswordController.php
│   │   │   │   ├── 🐘 EmailVerificationNotificationController.php
│   │   │   │   ├── 🐘 EmailVerificationPromptController.php
│   │   │   │   ├── 🐘 NewPasswordController.php
│   │   │   │   ├── 🐘 PasswordController.php
│   │   │   │   ├── 🐘 PasswordResetLinkController.php
│   │   │   │   ├── 🐘 RegisteredUserController.php
│   │   │   │   └── 🐘 VerifyEmailController.php
│   │   │   ├── 🐘 AuthController.php
│   │   │   ├── 🐘 Controller.php
│   │   │   ├── 🐘 CoverController.php
│   │   │   ├── 🐘 DocumentController.php
│   │   │   ├── 🐘 FolderController.php
│   │   │   ├── 🐘 FragmentController.php
│   │   │   ├── 🐘 FragmentMapsController.php
│   │   │   ├── 🐘 ProfileController.php
│   │   │   └── 🐘 WikiFeedController.php
│   │   ├── 📁 Middleware
│   │   │   └── 🐘 HandleInertiaRequests.php
│   │   └── 📁 Requests
│   │       ├── 📁 Auth
│   │       │   └── 🐘 LoginRequest.php
│   │       └── 🐘 ProfileUpdateRequest.php
│   ├── 📁 Jobs
│   │   ├── 🐘 AssembleFragmentsJob.php
│   │   ├── 🐘 DecryptDocumentJob.php
│   │   ├── 🐘 EmbedFragmentsJob.php
│   │   ├── 🐘 ExtractFragmentJob.php
│   │   └── 🐘 ProcessDocumentJob.php
│   ├── 📁 Models
│   │   ├── 🐘 Cover.php
│   │   ├── 🐘 Document.php
│   │   ├── 🐘 Folder.php
│   │   ├── 🐘 Fragment.php
│   │   ├── 🐘 FragmentMap.php
│   │   ├── 🐘 StegoFile.php
│   │   ├── 🐘 StegoMap.php
│   │   ├── 🐘 User.php
│   │   └── 🐘 WikiFeed.php
│   └── 📁 Providers
│       ├── 🐘 AppServiceProvider.php
│       ├── 🐘 B2Service.php
│       ├── 🐘 EncryptionService.php
│       └── 🐘 SegmentationService.php
├── 📁 bootstrap
│   ├── 🐘 app.php
│   └── 🐘 providers.php
├── 📁 config
│   ├── 🐘 app.php
│   ├── 🐘 auth.php
│   ├── 🐘 cache.php
│   ├── 🐘 database.php
│   ├── 🐘 filesystems.php
│   ├── 🐘 logging.php
│   ├── 🐘 mail.php
│   ├── 🐘 queue.php
│   ├── 🐘 services.php
│   └── 🐘 session.php
├── 📁 database
│   ├── 📁 factories
│   │   └── 🐘 UserFactory.php
│   ├── 📁 migrations
│   │   ├── 🐘 0001_01_01_000000_create_users_table.php
│   │   ├── 🐘 0001_01_01_000001_create_cache_table.php
│   │   ├── 🐘 0001_01_01_000002_create_jobs_table.php
│   │   ├── 🐘 2026_03_24_041618_create_documents_table.php
│   │   ├── 🐘 2026_03_24_102416_create_wiki_feeds_table.php
│   │   ├── 🐘 2026_03_25_061910_create_fragments_table.php
│   │   ├── 🐘 2026_03_25_092953_create_covers_table.php
│   │   ├── 🐘 2026_03_25_094033_create_fragment_maps_table.php
│   │   ├── 🐘 2026_03_30_033019_create_stego_maps_table.php
│   │   ├── 🐘 2026_03_30_033118_create_stego_files_table.php
│   │   └── 🐘 2026_04_21_031453_create_folders_table.php
│   ├── 📁 seeders
│   │   ├── 🐘 CoverTextSeeder.php
│   │   └── 🐘 DatabaseSeeder.php
│   └── ⚙️ .gitignore
├── 📁 public
│   ├── ⚙️ .htaccess
│   ├── 📄 favicon.ico
│   ├── 🐘 index.php
│   └── 📄 robots.txt
├── 📁 resources
│   ├── 📁 css
│   │   ├── 🎨 app.css
│   │   ├── 🎨 style.css
│   │   ├── 🎨 tailwind.css
│   │   └── 🎨 theme.css
│   ├── 📁 js
│   │   ├── 📁 Admin
│   │   │   ├── 📁 components
│   │   │   │   └── 📄 AdminDashboard.jsx
│   │   │   ├── 📁 pages
│   │   │   │   ├── 📄 AdminDashboardPage.jsx
│   │   │   │   ├── 📄 AdminLoginPage.jsx
│   │   │   │   └── 📄 AdminLoginWrapper.jsx
│   │   │   ├── 📄 AdminLayout.jsx
│   │   │   ├── 📄 AdminSidebar.jsx
│   │   │   └── 📄 AdminTopbar.jsx
│   │   ├── 📁 Components
│   │   │   ├── 📁 modals
│   │   │   │   ├── 📄 CoverFileSelectionModal.jsx
│   │   │   │   ├── 📄 DeleteConfirmModal.jsx
│   │   │   │   ├── 📄 FileInfoModal.jsx
│   │   │   │   ├── 📄 MoveFileModal.jsx
│   │   │   │   ├── 📄 NewFolderModal.jsx
│   │   │   │   ├── 📄 PreviewModal.jsx
│   │   │   │   ├── 📄 RenameModal.jsx
│   │   │   │   ├── 📄 ShareFileModal.jsx
│   │   │   │   ├── 📄 UploadModal.jsx
│   │   │   │   └── 📄 UploadOptionsModal.jsx
│   │   │   ├── 📄 ApplicationLogo.jsx
│   │   │   ├── 📄 Checkbox.jsx
│   │   │   ├── 📄 DangerButton.jsx
│   │   │   ├── 📄 DecorativeBackground.jsx
│   │   │   ├── 📄 Dropdown.jsx
│   │   │   ├── 📄 FileActionsMenu.jsx
│   │   │   ├── 📄 FolderGrid.jsx
│   │   │   ├── 📄 InputError.jsx
│   │   │   ├── 📄 InputLabel.jsx
│   │   │   ├── 📄 Modal.jsx
│   │   │   ├── 📄 NavLink.jsx
│   │   │   ├── 📄 PrimaryButton.jsx
│   │   │   ├── 📄 ResponsiveNavLink.jsx
│   │   │   ├── 📄 SearchBar.jsx
│   │   │   ├── 📄 SecondaryButton.jsx
│   │   │   ├── 📄 SecurityPanel.jsx
│   │   │   ├── 📄 Sidebar.jsx
│   │   │   ├── 📄 TextInput.jsx
│   │   │   └── 📄 UploadArea.jsx
│   │   ├── 📁 Layouts
│   │   │   ├── 📄 AuthenticatedLayout.jsx
│   │   │   └── 📄 GuestLayout.jsx
│   │   ├── 📁 Pages
│   │   │   ├── 📁 Auth
│   │   │   │   ├── 📄 ConfirmPassword.jsx
│   │   │   │   ├── 📄 ForgotPassword.jsx
│   │   │   │   ├── 📄 Login.jsx
│   │   │   │   ├── 📄 Register.jsx
│   │   │   │   ├── 📄 ResetPassword.jsx
│   │   │   │   └── 📄 VerifyEmail.jsx
│   │   │   ├── 📁 Profile
│   │   │   │   ├── 📁 Partials
│   │   │   │   │   ├── 📄 DeleteUserForm.jsx
│   │   │   │   │   ├── 📄 UpdatePasswordForm.jsx
│   │   │   │   │   └── 📄 UpdateProfileInformationForm.jsx
│   │   │   │   └── 📄 Edit.jsx
│   │   │   ├── 📄 Dashboard.jsx
│   │   │   ├── 📄 Main.jsx
│   │   │   ├── 📄 MyDocuments.jsx
│   │   │   ├── 📄 MyFolders.jsx
│   │   │   └── 📄 Welcome.jsx
│   │   ├── 📁 Utils
│   │   │   └── 📄 fileUtils.jsx
│   │   ├── 📄 app.jsx
│   │   └── 📄 bootstrap.js
│   └── 📁 views
│       └── 🐘 app.blade.php
├── 📁 routes
│   ├── 🐘 api.php
│   ├── 🐘 auth.php
│   ├── 🐘 console.php
│   └── 🐘 web.php
├── 📁 storage
│   ├── 📁 app
│   │   ├── 📁 private
│   │   │   └── ⚙️ .gitignore
│   │   ├── 📁 public
│   │   │   └── ⚙️ .gitignore
│   │   └── ⚙️ .gitignore
│   ├── 📁 framework
│   │   ├── 📁 sessions
│   │   │   └── ⚙️ .gitignore
│   │   ├── 📁 testing
│   │   │   └── ⚙️ .gitignore
│   │   ├── 📁 views
│   │   │   └── ⚙️ .gitignore
│   │   └── ⚙️ .gitignore
│   └── 📁 logs
│       └── ⚙️ .gitignore
├── 📁 tests
│   ├── 📁 Feature
│   │   ├── 📁 Auth
│   │   │   ├── 🐘 AuthenticationTest.php
│   │   │   ├── 🐘 EmailVerificationTest.php
│   │   │   ├── 🐘 PasswordConfirmationTest.php
│   │   │   ├── 🐘 PasswordResetTest.php
│   │   │   ├── 🐘 PasswordUpdateTest.php
│   │   │   └── 🐘 RegistrationTest.php
│   │   ├── 🐘 ExampleTest.php
│   │   └── 🐘 ProfileTest.php
│   ├── 📁 Unit
│   │   └── 🐘 ExampleTest.php
│   └── 🐘 TestCase.php
├── ⚙️ .editorconfig
├── ⚙️ .env.example
├── ⚙️ .gitattributes
├── ⚙️ .gitignore
├── 🐘 .phpstorm.meta.php
├── 📝 README.md
├── 🐘 _ide_helper.php
├── 🐘 _ide_helper_models.php
├── 📄 artisan
├── ⚙️ composer.json
├── ⚙️ jsconfig.json
├── ⚙️ package-lock.json
├── ⚙️ package.json
├── ⚙️ phpunit.xml
├── 📄 postcss.config.js
├── 📄 tailwind.config.cjs
├── 📄 tailwind.config.js
└── 📄 vite.config.js
```

---
*Generated by FileTree Pro Extension*