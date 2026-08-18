# Project TODO

- [x] Establish deep-space dark-mode-first visual system with responsive sidebar dashboard layout and micro-interactions
- [x] Add landing page hero with exact tagline "One Space. Every AI." and authentication calls to action
- [x] Extend user schema with approval status, access state, and audit-friendly metadata while preserving exact roles `admin` and `user`
- [x] Enforce pending-approval, rejected, suspended, and disabled access states on backend-protected procedures
- [x] Implement approval holding screen for newly registered users
- [x] Implement admin control center for user listing, approval/rejection, role updates, and access toggles
- [x] Integrate Manus OAuth using the prebuilt auth flow without substituting another provider
- [x] Add persistent conversations with title, timestamps, create, rename, and delete operations
- [x] Integrate the prebuilt AIChatBox component as the primary chat interface
- [x] Add model selection UI for GPT-4o, Claude, Gemini, and additional configured models with streaming-ready orchestration
- [x] Add projects workspace for organizing conversations into named projects/folders
- [x] Add S3-backed file upload metadata and chat attachment support
- [x] Add user usage dashboard with message count, token usage, and model breakdown charts
- [x] Add admin usage analytics with platform-wide, per-user, and per-model metrics
- [x] Add backend procedures and database helpers for all implemented feature surfaces
- [x] Write/update Vitest coverage for approval gating, admin authorization, conversations, and core user flows
- [x] Run type checks, tests, and visual verification; resolve errors
- [x] Save final checkpoint and deliver project version

## Implementation notes

- This is an initial production-oriented vertical slice of the larger attached HS Space master prompt; provider credentials and model availability remain configuration-driven.
- Backend authorization is authoritative; frontend visibility is only a convenience layer.
- No customer reviews, ratings, or testimonials are fabricated.
- Static media must remain outside the project directory and use managed storage URLs if added.
- The initial checkpoint will be created only after the first implementation is complete, per project workflow.

## History

- Initial project scaffold created from the full-stack web-db-user template.
- Clarified product requirements recorded from the user request.
- [x] User-requested scope update: build full-stack AI platform with mandatory approval flow, admin controls, chat, conversations, projects, attachments, usage, and analytics.

## Future extensions from master prompt

- [x] Deferred beyond the initial requested scope: provider-independent production model adapters and admin routing policies
- [x] Deferred beyond the initial requested scope: Prompt Studio with versioning, testing, publish, and rollback
- [x] Deferred beyond the initial requested scope: feature flags and plan/credit management
- [x] Deferred beyond the initial requested scope: RAG ingestion, embeddings, and vector search
- [x] Deferred beyond the initial requested scope: Website Builder, 3D Studio, Image Studio, and Cybersecurity modes
- [x] Deferred beyond the initial requested scope: MFA, device/session management, suspicious-login detection, and advanced audit logs
- [x] Deferred beyond the initial requested scope: email verification and password recovery flows beyond Manus OAuth
- [x] Deferred beyond the initial requested scope: subscription billing and enterprise operational controls

## Verification follow-ups

- [x] Add admin controls for reject, role changes, and re-enable access.
- [x] Implement conversation rename UX and fix new-chat reset with React state.
- [x] Add authenticated upstream SSE streaming endpoint and helper; full persistence-aware client wiring remains a documented follow-up.
- [x] Let users assign conversations to projects and show project organization.
- [x] Pass uploaded file references into chat context and visible message state.
- [x] Expand admin analytics with per-user activity and per-model breakdown panels.
- [x] Add Vitest coverage for conversation CRUD and authenticated user journeys.

## Final verification additions

- [x] Restore project assignment when loading a conversation, persist the selected project on first chat creation, and visibly label or group history by project.
- [x] Add stronger authenticated-flow tests for pending approval, admin actions, project assignment, and attachment-aware chat behavior.
- [x] Add Vitest coverage for attachment-aware chat behavior, verifying uploaded file references are incorporated into chat request/message state and remain gated by approved access.
- [x] Add end-to-end attachment-backed chat test for approved users and forbidden attachment-backed chat test for pending users.

## Latest user-requested changes

- [x] Move conversation history below the chat composer within the workspace.
- [x] Make the user-to-AI chat area full width above the history section.
- [x] Add a dedicated `/admin12-34` admin route with secure credential handling and no credential display in the UI.
- [x] Verify the revised layout and admin route, then save a new checkpoint.
- [x] Verify `/admin12-34` loads without displaying credentials and test `/api/private-admin-login` for valid and invalid credentials.

## Latest requested enhancements

- [x] Add conversation history search below the chat.
- [x] Add project filtering to the conversation history panel.
- [x] Keep the workspace fixed-width with no horizontal scrolling and preserve history below the chat.
- [x] Add dedicated admin logout and secure session revocation.
- [x] Wire the client chat to the SSE endpoint for live token streaming and persist the completed conversation.
- [x] Expand attachment handling to support common document, image, audio, video, text, and archive file types with safe validation.
- [x] Add tests and visual verification for the enhancements, then save a new checkpoint.

## Admin session hardening follow-ups

- [x] Replace in-memory admin route token revocation with durable session storage or signed random session IDs persisted server-side.
- [x] Add endpoint-level tests for admin login, logout cookie clearing, and session invalidation.
- [x] Save a new checkpoint after the latest history search/filter, SSE persistence, expanded file-type validation, and durable admin-session changes are complete.

## Latest requested platform updates

- [x] Add a dedicated approved username/password signup and login flow for workspace users.
- [x] Keep new accounts pending until an admin approves them; block login/workspace access before approval.
- [x] Add admin active-session inventory with creation times, expiry, session owner, and manual revoke buttons.
- [x] Let admins manage all users, approval/access state, roles, and view users' conversation history.
- [x] Keep admin controls hidden from normal product navigation and expose them through the private admin URL only.
- [x] Move history and usage into a ChatGPT-style left sidebar while preserving a clean chat workspace.
- [x] Adjust workspace width and height for a compact SaaS product layout without horizontal scrolling.
- [x] Add HS Space logo/favicon and correct browser tab title metadata.
- [x] Add tests and visual verification for the latest admin, auth, layout, and branding changes, then save a checkpoint.

## Visible authentication entry points

- [x] Add visible Login and Sign up buttons to the main HS Space website and route them to the approved username/password auth screen.

## Verification gap fixes

- [x] Make admin session revocation work for both admin and user sessions shown in the inventory, with tests for each kind.
- [x] Remove Admin control from normal product navigation for all standard workspace users; retain access only through the private admin URL flow.
- [x] Move Usage into the ChatGPT-style sidebar and remove the duplicate below-chat history panel, preserving search/filter controls in the sidebar.
- [x] Configure and verify a real HS Space favicon/logo asset instead of relying on an unverified placeholder.
- [x] Save a new checkpoint after the latest auth, admin, sidebar, and branding fixes are complete.

## Latest visual polish request

- [x] Remove excess workspace whitespace and unnecessary secondary labels/info.
- [x] Give the history sidebar more usable vertical space and improve its scroll behavior.
- [x] Make HS Space branding and section hierarchy clearer.
- [x] Preserve professional intentional scrolling without horizontal clipping or oversized empty chat panels.
- [x] Add tests/visual verification and save a new checkpoint.
- [x] Save a new checkpoint after the latest visual polish changes are complete and verified.

## Latest history and admin navigation request

- [x] Add admin user search by name, username, email, or open ID.
- [x] Add admin user pagination with page controls and total/result context.
- [x] Group sidebar chat history into Today, Previous 7 Days, and Older categories.
- [x] Add a History button that opens a dedicated history page with the full searchable/filterable conversation list.
- [x] Add tests and visual verification, then save a new checkpoint.
- [x] Add targeted unit coverage for admin search/pagination query shaping and a route-level assertion for the dedicated history page entry point.
- [x] Save a new checkpoint after the latest admin search/pagination and history-page changes are complete and verified.
- [x] Add a route-registration test confirming HISTORY_PATH is bound to HistoryPage and a navigation-level check confirming the sidebar History control targets the dedicated route.
- [x] Save a new checkpoint after the latest admin search/pagination and history-page changes are complete and verified.

## Latest responsive ChatGPT-style refinements

- [x] Place Projects above History in the workspace sidebar and make both destinations open their dedicated views.
- [x] Make each project card open a project-scoped conversation view with a clear way to start or reopen chats.
- [x] Remove excess spacing and secondary content; make the workspace use the available width and height professionally.
- [x] Improve text contrast, font sizing, focus states, and smooth transitions for responsive desktop/mobile behavior.
- [x] Add loading spinners and smooth pending transitions for admin user search and pagination.
- [x] Add tests and visual verification, then save a new checkpoint.
- [x] Save a new checkpoint after the latest responsive sidebar, project-page navigation, contrast/motion, and admin loading-state changes are complete and verified.

## Latest workspace hierarchy correction

- [x] Move the message composer clearly below the main chat content without overlap or clipped content.
- [x] Remove inline sidebar search, project filter, and usage/token controls from the workspace sidebar.
- [x] Add dedicated Projects and History navigation buttons below the main workspace navigation.
- [x] Keep Projects and History on separate screens with clear return-to-workspace controls.
- [x] Improve scroll containers with a subtle visible thumb and no awkward black line or overlay artifact.
- [x] Add tests and visual verification, then save a new checkpoint.
- [x] Add a direct source-level layout assertion proving the AI chat composer remains below the message area without overflow clipping.
- [x] Save a new checkpoint after the latest workspace hierarchy, sidebar, and scrollbar changes are complete and verified.

## Latest chat viewport refinement

- [x] Make the conversation area expand to the available screen height while keeping the prompt composer anchored at the bottom.
- [x] Verify the full-height chat layout on desktop and mobile without horizontal overflow.
- [x] Add/update tests and save a checkpoint for the chat viewport refinement.

## Latest system operation controls

- [x] Add light and dark theme controls to the System operational button/menu.
- [x] Show current token usage in the System operational menu using the existing usage data.
- [x] Verify the menu, theme switching, responsive behavior, tests, and save a checkpoint.
- [x] Enable functional theme switching through the application ThemeProvider and persist the selected theme.
- [x] Add functional light/dark theme verification and visual checks, then save a new checkpoint.

## Latest full-site theme and chat controls

- [x] Extend light/dark styling across the full website with readable foreground, muted, border, card, and navigation colors.
- [x] Add a smooth animated transition when switching between light and dark modes.
- [x] Add a Clear Chat action to the System operational menu that resets the current conversation.
- [x] Verify both themes, contrast, transition behavior, Clear Chat behavior, tests, and save a checkpoint.
- [x] Convert ProjectPage and remaining hardcoded dark-only surfaces to theme-aware classes.
- [x] Add explicit theme-state verification for light and dark root classes and capture both visual states.
- [x] Save a new checkpoint after the complete full-site theme and Clear Chat refinement.
- [x] Replace remaining Home hardcoded dark surfaces with theme-aware classes.
- [x] Ensure runtime theme tests are included in the configured Vitest suite and verify both theme states.
- [x] Save the final checkpoint after all theme and Clear Chat refinements are verified.
- [x] Replace the final hardcoded Home hex background classes with theme-aware surface classes.
- [x] Save a checkpoint after the final theme and Clear Chat cleanup.

## Admin ResizeObserver error

- [x] Identify the admin dashboard component or chart causing the ResizeObserver feedback loop.
- [x] Apply a targeted fix without suppressing legitimate runtime errors.
- [x] Verify /?admin=1, browser console output, tests, and save a checkpoint.
- [x] Identify and address the admin dashboard layout interaction causing the ResizeObserver loop through grid containment and disabling the loading transition.
- [x] Replace the provisional global warning suppression with a component-level layout fix.
- [x] Re-test the authenticated admin route with fresh console output and save a checkpoint.
- [x] Save a new checkpoint containing the component-level ResizeObserver fix and fresh admin-route verification.

## Latest authentication and admin access requirements

- [x] Audit current username/password auth, approval state, admin management, account identity, recovery, and responsive navigation behavior.
- [x] Add explicit Accept, Declined, and Blocked permission states with chat access enforcement and an admin-authored decline message.
- [x] Ensure new-device login/signup shows dedicated screens, duplicate email is rejected, and forgot-password has a clear recovery path.
- [x] Show the approved username as the account identity and keep admin pages limited to user, history, credentials-status, and permission management.
- [x] Refine responsive navigation so mobile users can open the full sidebar and keep New chat and Attach file controls accessible.
- [x] Add regression tests, verify the flows, and save a checkpoint.
- [x] Separate the admin route from the normal chat workspace so admins see only user, permissions, sessions, and history management.
- [x] Remove normal chat controls and non-management panels from the admin experience, then save a final checkpoint.
- [x] Save a final checkpoint containing the authentication, permission-state, recovery, responsive-navigation, and admin-only workspace changes.

## Latest profile, auth UX, admin filtering, and reusable skill request

- [x] Audit current profile settings, local auth handlers, admin user list, and skill packaging surfaces.
- [x] Add an approved-user profile settings page with username and password updates.
- [x] Add loading animations and clearer inline validation errors to login and signup screens.
- [x] Add admin user search and approval-status filtering with selected-user information/history visibility and no password exposure.
- [x] Create and validate a reusable HS Space workflow skill using the skill-creator process.
- [x] Add regression tests, verify responsive screens, save a checkpoint, and deliver the project and skill.
- [x] Guard the profile route for approved non-admin users with loading, redirect, and access-denied states.
- [x] Save the final project checkpoint and deliver it together with the validated reusable skill package.

## Latest security, recovery, and admin observability request

- [x] Audit current password recovery, session/usage data, admin surfaces, and light-theme tokens.
- [x] Add expiring hashed password-reset tokens with mock email delivery and secure reset completion.
- [x] Add audit-log persistence and admin visibility for profile changes, permission updates, login/signup, and reset requests.
- [x] Add detailed per-user activity views for sessions and chat usage timelines.
- [x] Harden admin/user role separation and verify readable light-theme styling across new surfaces.
- [x] Add regression tests, verify responsive admin flows, save a checkpoint, and deliver.

## Latest admin routing and light-theme request

- [x] Audit the home Login/Sign up actions, `/admin12-34` route handling, and light-mode text contrast.
- [x] Make `/admin12-34` open the private admin login/control-center flow instead of the normal workspace.
- [x] Keep home Login and Sign up visible and route users into the approved auth flow and chatbot after approval.
- [x] Make light-theme foreground, navigation, header, form, and admin text consistently readable with dark fonts.
- [x] Add regression tests, verify routes/themes/responsive behavior, save a checkpoint, and deliver.

## Latest session identity and profile security request

- [x] Audit current workspace/admin headers, profile settings, upload helpers, and browser regression setup.
- [x] Add explicit Admin and User session indicators in the correct headers.
- [x] Add an authenticated browser regression that logs into `/admin12-34` and verifies the control center.
- [x] Add secure avatar upload to approved-user profile settings.
- [x] Add live password-strength feedback to profile settings.
- [x] Run tests and visual verification, save a checkpoint, and deliver.
