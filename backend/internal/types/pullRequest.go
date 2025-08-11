package types

import "time"

type PullRequestsResp struct {
	Type  string        `json:"type"`
	Items []PullRequest `json:"items"`
}

type PullRequest struct {
	Title  string `json:"title"`
	Body   string `json:"body"`
	Number int    `json:"number"`
	State  string `json:"state"`
	User   struct {
		Login string `json:"login"`
	} `json:"user"`
	Files     []PRFile  `json:"files"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	HTMLURL   string    `json:"html_url"`
	DaysIdle  int       `json:"daysIdle"` // this we put in response
}

type PRFile struct {
	Filename  string `json:"filename"`
	Status    string `json:"status"`
	Additions int    `json:"additions"`
	Deletions int    `json:"deletions"`
	Changes   int    `json:"changes"`
	Patch     string `json:"patch,omitempty"`
}

type PRFilters struct {
	State     string
	Sort      string
	Direction string
	PerPage   string
}
