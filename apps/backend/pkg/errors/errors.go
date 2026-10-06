package errors

import (
	"fmt"

	"wh-logique/backend/pkg/response"
)

type AppError struct {
	Status  int
	Message string
	Details []response.ErrorDetail
	Err     error
}

func (e *AppError) Error() string {
	if e.Err == nil {
		return e.Message
	}

	return fmt.Sprintf("%s: %v", e.Message, e.Err)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

func New(status int, message string, err error) *AppError {
	return &AppError{Status: status, Message: message, Err: err}
}

func NewWithDetails(status int, message string, details []response.ErrorDetail, err error) *AppError {
	return &AppError{Status: status, Message: message, Details: details, Err: err}
}
