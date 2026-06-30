# OpenAPI Documentation for Gym App Backend API

This OpenAPI (formerly Swagger) specification provides complete API documentation for the Gym App Backend.

## API Overview

The Gym App Backend provides RESTful APIs for managing gym members, workout routines, exercise tracking, and session reports.

## Base URL

```
http://localhost:4000/api
```

## Authentication

This API uses JWT token-based authentication. Include your token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Common Response Schema

```yaml
StudentResponse:
  type: object
  properties:
    id:
      type: string
      description: Student UUID
    email:
      type: string
      format: email
      description: Student's email address
    firstName:
      type: string
      description: Student's first name
    lastName:
      type: string
      description: Student's last name
    height:
      type: integer
      description: Height in centimeters
    age:
      type: integer
      description: Age in years
    lifestyle:
      type: string
      enum: [sedentario, activo, muy_activo]
      description: Lifestyle level
    limitations:
      type: string
      description: Physical limitations
    weeklyFrequency:
      type: integer
      description: Weekly workout frequency (3 or 5)
    windowSize:
      type: integer
      description: Calculated history window size (weeklyFrequency * 2)
    profile:
      type: object
      description: Student profile information
    createdAt:
      type: string
      format: date-time
      description: Creation timestamp
    updatedAt:
      type: string
      format: date-time
      description: Last update timestamp
```

## Error Response

```yaml
Error:
  type: object
  properties:
    error:
      type: string
      description: Error type
    message:
      type: string
      description: Detailed error message
    details:
      type: array
      items:
        type: object
        properties:
          field:
            type: string
            description: Field that caused the error
          message:
            type: string
            description: Error message
    requestId:
      type: string
      description: Request ID for tracking
```

## API Endpoints

### Health Checks

#### GET /health
Returns the basic health status of the application.

**Responses:**
- `200`: Application is healthy

```yaml
responses:
  '200':
    description: Application is healthy
    content:
      application/json:
        schema:
          type: object
          properties:
            status:
              type: string
              example: ok
            timestamp:
              type: string
              format: date-time
```

#### GET /health/ready
Returns the readiness status with database and external service checks.

**Responses:**
- `200`: Ready to serve requests
- `503`: Not ready - one or more services unavailable

```yaml
responses:
  '200':
    description: Ready to serve requests
    content:
      application/json:
        schema:
          type: object
          properties:
            healthy:
              type: boolean
              example: true
            checks:
              type: array
              items:
                type: object
                properties:
                  database:
                    type: string
                    enum: [ok, error, not_configured]
                  redis:
                    type: string
                    enum: [ok, error]
                  n8n:
                    type: string
                    enum: [ok, error, not_configured]
            timestamp:
              type: string
              format: date-time
            service:
              type: string
              example: gym-app-backend
  '503':
    description: Service not ready
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

### Student Management

#### POST /api/students
Create a new student.

**Request Body:**
```yaml
CreateStudentDTO:
  type: object
  required:
    - email
    - firstName
    - lastName
    - height
    - age
    - lifestyle
    - weeklyFrequency
  properties:
    email:
      type: string
      format: email
      example: student@example.com
    firstName:
      type: string
      example: John
    lastName:
      type: string
      example: Doe
    height:
      type: integer
      example: 180
    age:
      type: integer
      example: 30
    lifestyle:
      type: string
      enum: [sedentario, activo, muy_activo]
      example: activo
    limitations:
      type: string
      example: ""
    weeklyFrequency:
      type: integer
      enum: [3, 5]
      example: 3
  description: Student creation data
```

**Responses:**
- `201`: Student created successfully
- `400`: Validation error
- `409`: Email already exists

```yaml
responses:
  '201':
    description: Student created successfully
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/StudentResponse'
  '400':
    description: Validation error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
  '409':
    description: Email already exists
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

#### GET /api/students
List all students.

**Responses:**
- `200`: List of students

```yaml
responses:
  '200':
    description: List of students
    content:
      application/json:
        schema:
          type: array
          items:
            $ref: '#/components/schemas/StudentResponse'
```

#### GET /api/students/{id}
Get a student by ID.

**Parameters:**
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
    description: Student ID
```

**Responses:**
- `200`: Student found
- `404`: Student not found

```yaml
responses:
  '200':
    description: Student found
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/StudentResponse'
  '404':
    description: Student not found
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

#### GET /api/students/{id}/profile
Get student profile information.

**Parameters:**
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
    description: Student ID
```

**Responses:**
- `200`: Profile information
- `404`: Student not found

```yaml
responses:
  '200':
    description: Profile information
    content:
      application/json:
        schema:
          type: object
          properties:
            id:
              type: string
            studentId:
              type: string
            status:
              type: string
              example: ACTIVE
            createdAt:
              type: string
              format: date-time
            updatedAt:
              type: string
              format: date-time
  '404':
    description: Student not found
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

#### PUT /api/students/{id}
Update a student.

**Parameters:**
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
    description: Student ID
```

**Request Body:**
```yaml
UpdateStudentDTO:
  type: object
  properties:
    email:
      type: string
      format: email
    firstName:
      type: string
    lastName:
      type: string
    height:
      type: integer
    age:
      type: integer
    lifestyle:
      type: string
      enum: [sedentario, activo, muy_activo]
    limitations:
      type: string
    weeklyFrequency:
      type: integer
      enum: [3, 5]
  description: Student update data (all optional)
```

**Responses:**
- `200`: Student updated successfully
- `400`: Validation error
- `404`: Student not found
- `409`: Email already exists

```yaml
responses:
  '200':
    description: Student updated successfully
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/StudentResponse'
  '400':
    description: Validation error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
  '404':
    description: Student not found
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
  '409':
    description: Email already exists
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

#### DELETE /api/students/{id}
Delete a student.

**Parameters:**
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
    description: Student ID
```

**Responses:**
- `200`: Student deleted successfully
- `404`: Student not found

```yaml
responses:
  '200':
    description: Student deleted successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            message:
              type: string
              example: Student deleted successfully
            student:
              $ref: '#/components/schemas/StudentResponse'
  '404':
    description: Student not found
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

### Session Reports

#### POST /api/session-reports
Create a session report.

**Request Body:**
```yaml
CreateSessionReportDTO:
  type: object
  required:
    - studentId
    - content
  properties:
    studentId:
      type: string
      description: Student ID
    content:
      type: string
      minLength: 1
      maxLength: 10000
      description: Session report content (max 10000 characters)
  description: Session report creation data
```

**Responses:**
- `201`: Session report created successfully
- `400`: Validation error
- `404`: Student not found

```yaml
responses:
  '201':
    description: Session report created successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            id:
              type: string
            studentId:
              type: string
            content:
              type: string
            createdAt:
              type: string
              format: date-time
            student:
              type: object
              properties:
                id:
                  type: string
                firstName:
                  type: string
                lastName:
                  type: string
  '400':
    description: Validation error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
  '404':
    description: Student not found
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

#### GET /api/session-reports/student/{studentId}
Get session reports for a student.

**Parameters:**
```yaml
parameters:
  - name: studentId
    in: path
    required: true
    schema:
      type: string
    description: Student ID
```

**Responses:**
- `200`: List of session reports
- `404`: Student not found

```yaml
responses:
  '200':
    description: List of session reports
    content:
      application/json:
        schema:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
              studentId:
                type: string
              content:
                type: string
              createdAt:
                type: string
                format: date-time
              student:
                type: object
                properties:
                  id:
                    type: string
                  firstName:
                    type: string
                  lastName:
                    type: string
  '404':
    description: Student not found
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

#### DELETE /api/session-reports/{id}
Delete a session report.

**Parameters:**
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
    description: Session report ID
```

**Responses:**
- `200`: Session report deleted successfully
- `404`: Session report not found

```yaml
responses:
  '200':
    description: Session report deleted successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            message:
              type: string
              example: Session report deleted successfully
            sessionReport:
              type: object
              properties:
                id:
                  type: string
                studentId:
                  type: string
                content:
                  type: string
                createdAt:
                  type: string
                  format: date-time
  '404':
    description: Session report not found
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

### Workout Session

#### GET /api/routines/{id}/session
Get a workout session with exercises and their logs.

**Parameters:**
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
    description: Routine ID
```

**Responses:**
- `200`: Workout session details
- `404`: Routine not found

```yaml
responses:
  '200':
    description: Workout session details
    content:
      application/json:
        schema:
          type: object
          properties:
            routine:
              type: object
              properties:
                id:
                  type: string
                name:
                  type: string
                description:
                  type: string
                status:
                  type: string
                generatedAt:
                  type: string
                  format: date-time
                student:
                  type: object
                  properties:
                    id:
                      type: string
                    firstName:
                      type: string
                    lastName:
                      type: string
                exercises:
                  type: array
                  items:
                    type: object
                    properties:
                      id:
                        type: string
                      name:
                        type: string
                      sets:
                        type: integer
                      reps:
                        type: string
                      restSeconds:
                        type: integer
                      order:
                        type: integer
                      logs:
                        type: array
                        items:
                          type: object
                          properties:
                            id:
                              type: string
                            exerciseId:
                              type: string
                            studentId:
                              type: string
                            completion:
                              type: string
                              enum: [SOBRADO, AL_LIMITE, CON_DIFICULTAD, NO_PUDO_TERMINARLO_BIEN]
                            actualSets:
                              type: integer
                            actualReps:
                              type: string
                            weightKg:
                              type: number
                              format: float
                            rpe:
                              type: integer
                            notes:
                              type: string
                            performedAt:
                              type: string
                              format: date-time
  '404':
    description: Routine not found
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

#### POST /api/exercise-logs
Log an exercise execution.

**Request Body:**
```yaml
CreateExerciseLogDTO:
  type: object
  required:
    - exerciseId
    - completion
  properties:
    exerciseId:
      type: string
      description: Exercise ID
    completion:
      type: string
      enum: [SOBRADO, AL_LIMITE, CON_DIFICULTAD, NO_PUDO_TERMINARLO_BIEN]
      description: Completion status
    actualSets:
      type: integer
      description: Actual number of sets completed
    actualReps:
      type: string
      description: Actual repetitions (e.g., "8-12", "3x10")
    weightKg:
      type: number
      format: float
      description: Weight in kilograms
    rpe:
      type: integer
      minimum: 1
      maximum: 10
      description: Rate of Perceived Exertion (1-10)
    notes:
      type: string
      description: Exercise notes
  description: Exercise log creation data
```

**Responses:**
- `201`: Exercise log created successfully
- `400`: Validation error
- `404`: Exercise or routine not found

```yaml
responses:
  '201':
    description: Exercise log created successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            id:
              type: string
            exerciseId:
              type: string
            studentId:
              type: string
            completion:
              type: string
            actualSets:
              type: integer
            actualReps:
              type: string
            weightKg:
              type: number
              format: float
            rpe:
              type: integer
            notes:
              type: string
            performedAt:
              type: string
              format: date-time
  '400':
    description: Validation error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
  '404':
    description: Exercise or routine not found
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

#### PATCH /api/exercise-logs/{id}
Update an exercise log.

**Parameters:**
```yaml
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: string
    description: Exercise log ID
```

**Request Body:**
```yaml
UpdateExerciseLogDTO:
  type: object
  properties:
    completion:
      type: string
      enum: [SOBRADO, AL_LIMITE, CON_DIFICULTAD, NO_PUDO_TERMINARLO_BIEN]
    actualSets:
      type: integer
    actualReps:
      type: string
    weightKg:
      type: number
      format: float
    rpe:
      type: integer
      minimum: 1
      maximum: 10
    notes:
      type: string
  description: Partial exercise log update data
```

**Responses:**
- `200`: Exercise log updated successfully
- `400`: Validation error
- `404`: Exercise log not found

```yaml
responses:
  '200':
    description: Exercise log updated successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            id:
              type: string
            exerciseId:
              type: string
            studentId:
              type: string
            completion:
              type: string
            actualSets:
              type: integer
            actualReps:
              type: string
            weightKg:
              type: number
              format: float
            rpe:
              type: integer
            notes:
              type: string
            performedAt:
              type: string
              format: date-time
  '400':
    description: Validation error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
  '404':
    description: Exercise log not found
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
```

## Error Handling

All API endpoints return consistent error responses in the format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": [
    {
      "field": "field.name",
      "message": "Error message for this field"
    }
  ],
  "requestId": "UUID"
}
```

## Security Headers

The API includes security headers:
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block

## Request ID

Each request includes a unique request ID in the `x-request-id` header for tracing and debugging.

## Rate Limiting

The API is protected by rate limiting (100 requests per 15 minutes per IP address).

## Best Practices

1. Always validate request payloads against the schema
2. Include the requestId in error reports for debugging
3. Use appropriate HTTP status codes
4. Handle errors consistently across all endpoints
5. Implement proper CORS policies for cross-origin requests

## API Versioning

Currently, the API is at version 1.0.0. Future versions will be released under `/api/v2/`.

## Changelog

### v1.0.0
- Initial release with all 6 phases completed
- Full CRUD operations for Students
- Exercise routines with n8n integration
- Exercise execution logging with completion tracking
- Session reports with dynamic history views
- Production-ready error handling, security, and health checks
- OpenAPI documentation

## License

This project is part of the Gym App - Sistemas de gestión de gimnasios.

---

This documentation is auto-generated from the OpenAPI specification and reflects the current API capabilities.
