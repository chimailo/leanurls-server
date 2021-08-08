import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Link } from './../../entities/link';

@ValidatorConstraint({ async: true })
export class UniqueAlias
  implements ValidatorConstraintInterface {
  validate(alias: string) {
    return Link.findOne({ where: { alias } }).then((link) => {
      if (link) return false;
      return true;
    });
  }
  defaultMessage() {
    return "The alias you provided for the link is already taken"
  }
}

export function IsAliasAlreadyTaken(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: UniqueAlias,
    });
  };
}
