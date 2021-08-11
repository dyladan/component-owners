import { isRight } from 'fp-ts/Either';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/PathReporter';

export function withDefault<T extends t.Any>(type: T, defaultValue: t.TypeOf<T>): t.Type<t.TypeOf<T>> {
    return new t.Type(
        type.name,
        type.is,
        (v, c) => type.validate(v != null ? v : defaultValue, c),
        type.encode,
    )
}

export const StringList = new t.Type(
    'StringList',
    t.array(t.string).is,
    (u, c) => {
        if (t.string.is(u)) {
            return t.success(u.split(/\s+/));
        }

        if (t.array(t.string).is(u)) {
            return t.success(u);
        }

        return t.failure(u, c, 'must be string or array of strings');
    },
    t.identity,
);

export function mustDecode<I, A>(decoder: t.Decoder<I, A>, input: I): A {
    const result = decoder.decode(input);
    if (isRight(result)) {
        return result.right;
    }

    const errs = PathReporter.report(result);
    throw new Error(errs[0]);
}
