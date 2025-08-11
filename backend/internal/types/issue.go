package types

import "time"

type IssuesResp struct {
	Items []Issue `json:"items"`
	Type  string  `json:"type"`
}

type Issue struct {
	Title  string `json:"title"`
	Body   string `json:"body"`
	Number int    `json:"number"`
	State  string `json:"state"`
	User   struct {
		Login string `json:"login"`
	} `json:"user"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	HTMLURL   string    `json:"html_url"`
	DaysIdle  int       `json:"daysIdle"` // this we put in response
}
