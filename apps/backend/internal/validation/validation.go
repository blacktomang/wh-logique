package validation

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"unicode/utf8"

	"wh-logique/backend/pkg/response"
)

func DecodeJSON(body io.Reader, destination any) []response.ErrorDetail {
	decoder := json.NewDecoder(body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(destination); err != nil {
		return []response.ErrorDetail{decodeErrorDetail(err)}
	}

	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return []response.ErrorDetail{{Field: "body", Reason: "Must contain a single JSON object"}}
	}

	return nil
}

func RequiredString(field, value string, maxLength int) (string, *response.ErrorDetail) {
	normalized := strings.TrimSpace(value)
	if normalized == "" {
		return "", &response.ErrorDetail{Field: field, Reason: "Required"}
	}
	if utf8.RuneCountInString(normalized) > maxLength {
		return "", &response.ErrorDetail{
			Field:  field,
			Reason: fmt.Sprintf("Must be at most %d characters", maxLength),
		}
	}

	return normalized, nil
}

func OneOf(field, value string, allowed ...string) *response.ErrorDetail {
	for _, candidate := range allowed {
		if value == candidate {
			return nil
		}
	}

	return &response.ErrorDetail{
		Field:  field,
		Reason: "Must be one of: " + strings.Join(allowed, ", "),
	}
}

func decodeErrorDetail(err error) response.ErrorDetail {
	if errors.Is(err, io.EOF) {
		return response.ErrorDetail{Field: "body", Reason: "Required"}
	}

	var syntaxError *json.SyntaxError
	if errors.As(err, &syntaxError) {
		return response.ErrorDetail{Field: "body", Reason: "Must contain valid JSON"}
	}

	var typeError *json.UnmarshalTypeError
	if errors.As(err, &typeError) {
		field := typeError.Field
		if field == "" {
			field = "body"
		}
		return response.ErrorDetail{Field: field, Reason: "Has an invalid type"}
	}

	const unknownFieldPrefix = "json: unknown field "
	if strings.HasPrefix(err.Error(), unknownFieldPrefix) {
		field := strings.Trim(strings.TrimPrefix(err.Error(), unknownFieldPrefix), `"`)
		return response.ErrorDetail{Field: field, Reason: "Unknown field"}
	}

	return response.ErrorDetail{Field: "body", Reason: "Must contain valid JSON"}
}
