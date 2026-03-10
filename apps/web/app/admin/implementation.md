# Tickets Page Component Architecture

## Civic Complaint Management System (JanSamadhan / PS-CRM)

---

# 1. Overview

The **Tickets Page (`/tickets`)** is the central operational interface where administrators and authorities manage complaints submitted by citizens.

To ensure scalability, maintainability, and clean code practices, the page should be structured using **modular UI components** rather than a single monolithic file.

Each component should have a **clear responsibility**, allowing developers to easily update or extend functionality without affecting the entire page.

---

# 2. Page Structure

The Tickets Page should follow a layered structure consisting of:

1. Page container
2. Header section
3. Search functionality
4. Filters
5. Tickets table
6. Ticket rows
7. Status and priority indicators
8. Ticket action buttons
9. Pagination controls

This ensures the page remains organized even when managing **thousands of complaints**.

---

# 3. Component Architecture

The following components should be used to construct the `/tickets` page.

## TicketsPage

This is the **main container component** that orchestrates all other components.

Responsibilities:

* Fetch tickets from the backend
* Manage search queries
* Manage filter state
* Handle pagination
* Pass data to child components

Structure:

```
TicketsPage
 ├── TicketsHeader
 ├── TicketSearch
 ├── TicketFilters
 ├── TicketsTable
 └── Pagination
```

---

# 4. TicketsHeader Component

The **TicketsHeader** component provides contextual information about the workspace.

Displayed information may include:

* Workspace title
* Current date
* Location or system context

Example:

```
JanSamadhan Tickets | Central Workspace
Sunday, March 8, 2026
Jaipur, India
```

Purpose:

* Establish context
* Improve orientation for administrators

---

# 5. TicketSearch Component

The **TicketSearch** component provides a search interface to quickly locate tickets.

Capabilities:

* Search by Ticket ID
* Search by complaint title
* Search by location
* Search by category

Example UI:

```
Search by ID, location, or category...
```

The search component sends the query to the parent page, which then filters the ticket results.

---

# 6. TicketFilters Component

The **TicketFilters** component allows users to narrow down the ticket list using multiple filter categories.

Filters should include:

### Status

* Pending
* In Progress
* Resolved
* Escalated

### Category

Examples:

* Road Damage
* Garbage Collection
* Water Leakage
* Streetlight Failure
* Public Safety

### Authority

Examples:

* Municipal Corporation
* Electricity Board
* Water Supply Department
* Police Department

### Priority

* Low
* Medium
* High
* Emergency

Example filter layout:

```
[Status ▼]   [Category ▼]   [Authority ▼]   [Priority ▼]
```

These filters help administrators efficiently manage large datasets.

---

# 7. TicketsTable Component

The **TicketsTable** component is responsible for displaying the main ticket list in tabular form.

The table should contain the following columns:

* Ticket ID
* Title
* Category
* Location
* Status
* Priority
* Created time
* Assigned authority
* Assigned worker
* Actions

Example layout:

```
-------------------------------------------------------------
ID        Title                Status       Priority
-------------------------------------------------------------
CR-10421  Streetlight broken   Pending      Medium
CR-10422  Garbage not collected In Progress Low
-------------------------------------------------------------
```

The table dynamically renders ticket rows based on data received from the backend.

---

# 8. TicketRow Component

The **TicketRow** component represents a single ticket entry within the table.

Each row displays the core complaint details and uses smaller components for status indicators and actions.

Typical row structure:

```
CR-10423
Streetlight broken near school
Ward 4
In Progress
High
2 hours ago
Lighting Department
Ramesh Patel
```

Responsibilities:

* Render ticket information
* Display status badge
* Display priority badge
* Provide action buttons

---

# 9. StatusBadge Component

The **StatusBadge** component visually represents the current state of a complaint.

Statuses should be color-coded to improve readability.

Example color mapping:

* Pending → Yellow
* In Progress → Blue
* Resolved → Green
* Escalated → Red

Example:

```
[ Pending ]
[ In Progress ]
[ Resolved ]
```

Color indicators allow administrators to scan large tables quickly.

---

# 10. PriorityBadge Component

The **PriorityBadge** component displays the urgency level of the complaint.

Priority levels:

* Low
* Medium
* High
* Emergency

Example color mapping:

* Low → Gray
* Medium → Yellow
* High → Orange
* Emergency → Red

This helps highlight complaints that require immediate attention.

---

# 11. TicketActions Component

The **TicketActions** component provides operational controls for each ticket.

Typical actions include:

* View ticket
* Assign worker
* Escalate complaint

Example UI icons:

```
👁 View
👤 Assign
⚠ Escalate
```

These quick actions reduce navigation friction and allow administrators to respond quickly.

---

# 12. Pagination Component

The **Pagination** component manages navigation between ticket pages.

Example UI:

```
← Previous   1 2 3 ... 211   Next →
```

This component ensures that only a limited number of tickets are loaded per page, improving performance.

Typical configuration:

* 20 tickets per page
* Dynamic page navigation
* Display total ticket count

Example:

```
Showing 1–20 of 4,210 tickets
```

---

# 13. Component Hierarchy

The complete component hierarchy of the Tickets Page is as follows:

```
TicketsPage
 ├── TicketsHeader
 ├── TicketSearch
 ├── TicketFilters
 ├── TicketsTable
 │     └── TicketRow
 │           ├── StatusBadge
 │           ├── PriorityBadge
 │           └── TicketActions
 └── Pagination
```

This structure ensures a clean separation of responsibilities.

---

# 14. Benefits of Component-Based Design

Using modular components provides several advantages:

* Improved code readability
* Easier debugging and testing
* Reusability across different pages
* Better scalability as the system grows
* Faster development when adding new features

For example, the **StatusBadge** component could also be reused in:

* Ticket detail pages
* Worker dashboards
* Authority performance reports

---

# 15. Summary

The `/tickets` page should be built using a **modular component architecture** to support scalability and maintainability.

The key components required include:

* TicketsPage
* TicketsHeader
* TicketSearch
* TicketFilters
* TicketsTable
* TicketRow
* StatusBadge
* PriorityBadge
* TicketActions
* Pagination

Together, these components create a structured and efficient interface for managing civic complaints within the platform.
