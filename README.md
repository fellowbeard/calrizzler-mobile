# Calrizzler Mobile

Mobile application for **Calrizzler**, a scheduling and client-management platform for service-based businesses.

The app provides mobile access to the same Calrizzler account, scheduling, client, service, and resource data used by the web application.

## Tech Stack

- React Native
- Expo
- TypeScript
- Expo Router
- React Navigation
- Expo SecureStore
- React Native Reanimated
- React Native Safe Area Context
- `@react-native-community/datetimepicker`
- `@react-native-picker/picker`

## Features

### Authentication

The mobile application authenticates against the Calrizzler Rails API using JWTs.

Authentication tokens are stored using Expo SecureStore.

The shared API client retrieves the token and automatically adds it to protected requests:

```http
Authorization: Bearer <token>
```

Public endpoints such as login can explicitly disable authentication.

### Navigation

The application uses Expo Router and drawer-based navigation.

Primary application areas include:

- Dashboard
- Appointments
- Clients
- Services
- Resources
- Settings
- Logout

### Dashboard

The mobile dashboard includes a calendar view for quickly viewing scheduled appointments.

Appointments can be selected from the calendar to navigate to their details.

### Appointments

The mobile appointment workflow supports:

- viewing appointments
- creating appointments
- editing appointments
- selecting a client
- selecting a resource
- selecting multiple services
- scheduling date and time
- calculated appointment duration
- manual duration overrides
- appointment status

New appointments default to a scheduled state.

Status changes, including cancellation, are available when editing an existing appointment.

### Clients

Users can:

- view clients
- create clients
- edit clients
- select clients when scheduling appointments

A new client can also be created directly from the appointment workflow and returned to the appointment form as the selected client.

### Services

Services can be selected when creating an appointment.

The durations of selected services are combined to determine the default appointment duration.

### Resources

Resources represent whatever must be reserved for an appointment.

Appointments display their assigned resource, and resource availability is enforced by the backend.

### Permissions

The application respects the authenticated user's role:

```text
owner
staff
read_only
```

Actions such as creating and editing records can be restricted based on write access.

The Rails API remains responsible for enforcing authorization and account isolation.

## API Client

The application uses a shared `apiFetch` client for communication with the Rails API.

The client handles:

- API base URLs
- SecureStore authentication tokens
- bearer authentication
- JSON responses
- API errors
- validation errors
- non-JSON server failures

Example:

```ts
apiFetch("/api/v1/me");
```

Public request:

```ts
apiFetch("/api/v1/login", {
  method: "POST",
  auth: false,
});
```

## Testing

The mobile application uses Jest for unit testing.

API client tests use mocked network responses rather than making requests to a running Rails server.

Tests verify behavior including:

- retrieving stored authentication tokens
- adding bearer authentication
- omitting authentication for public requests
- parsing successful responses
- handling structured validation errors
- creating `ApiError` instances for failed requests
- handling server responses without JSON

## Development

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start
```

From the Expo development environment, the application can be launched on a supported simulator, emulator, web browser, or development device.

## Application Structure

The application uses Expo Router's file-based routing.

The project includes screens for resources such as:

```text
app/
├── appointments/
├── clients/
├── resources/
├── services/
└── settings/
```

Reusable form components handle create and edit workflows for the application's primary resources.

## Backend

Calrizzler Mobile communicates with the Calrizzler Rails API.

The backend is responsible for:

- authentication
- account isolation
- authorization
- clients
- services
- resources
- appointments
- notes
- users
- scheduling conflicts
- validation

The mobile app should not be considered the security boundary. All permissions and account ownership rules are enforced again by the API.

## Current Development

Current development is focused on:

- appointment scheduling
- calendar behavior
- timezone handling
- validation and API error handling
- automated testing
- keeping mobile behavior consistent with the web application
