import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { DocumentSectionDef } from '../constants/document-sections.constants';

/**
 * Validates that a `sections` payload (Record<sectionTitle, Record<fieldKey, string>>)
 * only contains section titles / field keys that exist in the given section
 * definitions (BRIEF_SECTIONS or REKI_SECTIONS). Unknown sections aren't
 * required to be present (partial saves / drafts are fine) but nothing
 * unrecognised is allowed through.
 */
export function IsValidSections(
  sectionDefs: DocumentSectionDef[],
  validationOptions?: ValidationOptions,
) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isValidSections',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (
            value === null ||
            typeof value !== 'object' ||
            Array.isArray(value)
          ) {
            return false;
          }

          const allowedSectionTitles = new Set(sectionDefs.map((s) => s.title));
          const fieldsBySection = new Map(
            sectionDefs.map((s) => [
              s.title,
              new Set(s.fields.map((f) => f.key)),
            ]),
          );

          for (const [sectionTitle, sectionValue] of Object.entries(
            value as Record<string, unknown>,
          )) {
            if (!allowedSectionTitles.has(sectionTitle)) {
              return false;
            }
            if (
              sectionValue === null ||
              typeof sectionValue !== 'object' ||
              Array.isArray(sectionValue)
            ) {
              return false;
            }

            const allowedKeys = fieldsBySection.get(
              sectionTitle,
            ) as Set<string>;
            for (const [fieldKey, fieldValue] of Object.entries(
              sectionValue as Record<string, unknown>,
            )) {
              if (!allowedKeys.has(fieldKey)) {
                return false;
              }
              if (
                fieldValue !== undefined &&
                fieldValue !== null &&
                typeof fieldValue !== 'string'
              ) {
                return false;
              }
            }
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} contains an unknown section or field key`;
        },
      },
    });
  };
}
