const scheme = [
    {
        name : 'name',
    },
    {
        name : 'id',
        type : 'int'
    },
    {
        name : 'cost_open',
        path : 'cost.open'
    },
    {
        name : 'cost_upgrade',
        path : 'cost.upgrade',
    },
    {
        name : 'cost_open_text',
        path : 'cost.open',
        prepare : (param) => param + ' USD'
    },
    {
        name : 'image',
        custom : ({scheme_obj, input_obj, custom_param}) => scheme_obj.id + '.' + custom_param.ext,
        custom_param : {
            'ext': 'png'
        }
    },
    {
        name: 'cost',
        type : 'object', 
        scheme : [
            {
                name : 'open',
                type : 'int',
            },
            {
                name : 'upgrade',
                path : 'upgrade',
                type : 'int'
            }
        ]
    },
    {
        name : 'items',
        type : 'array',
        scheme : [
            {
                name : 'type',
            },
            {
                name : 'name',
                path : 'item.game_item.name'
            },
            {
                name : 'id',
                path : 'item.id',
                type : 'int',
            },
            {
                name : 'game_id',
                path : 'item.game_item.id'
            },

        ]
    }
];
const input_data = {
    name : 'Test1',
    id : '20',
    cost : {
        open : '40',
        upgrade : '30'
    },
    items : [
        {
            type : 'module',
            item : {
                id : '50',
                game_item : {
                    id : 'bp_3',
                    name : 'Test item 1'
                }
            }
        },
        {
            type : 'item',
            item : {
                id : '2958',
                game_item : {
                    id : 'real_id',
                    name : 'Test item 2'
                }
            }
        }
    ]
};

const pathInObj = (obj, path) => {
    path = path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    path = path.replace(/^\./, '');           // strip a leading dot
    let path_list = path.split('.');
    for (let i = 0, n = path_list.length; i < n; i++) {
        let path_part = path_list[i];
        if (typeof obj === 'object' && path_part in obj) {
            obj = obj[path_part];
        } else {
            return;
        }

    }
    return obj;
}

const getPath = (scheme) => (scheme.path) ? scheme.path : scheme.name;
const prepareType = (val, type) => {
    if (type === 'int') {
        return parseInt(val, 10);
    }
    if (type === 'string') {
        return val + '';
    }
}

const mapParam = (scheme, {scheme_obj, input_obj}) => {
    let result = pathInObj(input_obj, getPath(scheme));
    if (typeof result === 'undefined' && !scheme.custom) {
        console.warn('bad scheme part:', scheme);
    }
    if (scheme.prepare) {
        result = scheme.prepare(result);
    }
    if (scheme.custom) {
        result = scheme.custom({custom_param : scheme.custom_param, scheme_obj, input_obj});
    }
    if (scheme.type) {
        result = prepareType(result, scheme.type);
    }
    return result;

};
const dataMapper = (scheme, input_obj) => {
    let result = {};
    for (let i = 0, count = scheme.length; i < count; i++) {
        let s = scheme[i];
        if (s.type === 'array') {
            result[s.name] = [];
            let val = pathInObj(input_obj, getPath(s));
            if (Array.isArray(val) && val.length) {
                result[s.name] = val.map((item) => dataMapper(s.scheme, item));
            } else {
                //TODO some error may be? or ignore?
            }
        } else if (s.type === 'object') {
            result[s.name] = dataMapper(s.scheme, pathInObj(input_obj, getPath(s)));
        } else {
            result[s.name] = mapParam (s, {scheme_obj : result, input_obj});
        }
    }
    return result;
}
const res = dataMapper(scheme, input_data);
console.log(res);
