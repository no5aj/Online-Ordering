define([], function() {
    return {
        "defaults": {
            "description": null,
            "id": null,
            "id_category" : null,
            "image": null,
            "images": [],
            "is_cold": false,
            "name": null,
            "price": null,
            "img" : null,
            "tax" : 0,
            "sort": null,
            "course_number" : null,
            "cost" : null,
            "sold_by_weight" : false,
            "uom" : "",
            "attribute_type": 0,
            "child_products": null,
            "attribute_1_name": null,
            "attribute_2_name": null,
            "attribute_1_enable": false,
            "attribute_2_enable": false,
            "attribute_1_selected": null,
            "attribute_2_selected": null,
            "is_gift": false,
            "gift_card_number": null,
            "checked_gift_cards": null,
            "stock_amount": 999,
            "active": true,
            "created_date": null,
            "timetables": null,
            "compositeId": null,
            "size_chart" : "",
            "is_combo": false,
            "combo_price": null,
            "has_upsell": false,
            "actual_data": null,
            "max_price": null
        },
        "defaults_initialized": {
            "description": null,
            "id": null,
            "id_category" : null,
            "image": 'test.png',
            "images": [],
            "is_cold": false,
            "name": null,
            "price": null,
            "img" : './test/path/',
            "tax" : 0,
            "sort": null,
            "course_number" : null,
            "cost" : null,
            "sold_by_weight" : false,
            "uom" : "",
            "attribute_type": 0,
            "child_products": null,
            "attribute_1_name": null,
            "attribute_2_name": null,
            "attribute_1_enable": false,
            "attribute_2_enable": false,
            "attribute_1_selected": null,
            "attribute_2_selected": null,
            "is_gift": false,
            "gift_card_number": null,
            "checked_gift_cards": {},
            "stock_amount": 999,
            "active": true,
            "created_date": 0,
            "timetables": null,
            "compositeId": null,
            "size_chart" : "",
            "is_combo": false,
            "combo_price": null,
            "has_upsell": false,
            "actual_data": null,
            "max_price": null
        },
        "product_with_image": {
            "description": "some product",
            "id": 12,
            "id_category" : 1,
            "image": 'test_image.png',
            "images": [],
            "is_cold": false,
            "name": "Test product",
            "price": 9.50,
            "img" : null,
            "tax" : 0,
            "sort": 12,
            "course_number" : null,
            "cost" : 1,
            "sold_by_weight" : false,
            "uom" : "",
            "attribute_type": 0,
            "child_products": null,
            "attribute_1_name": null,
            "attribute_2_name": null,
            "attribute_1_enable": false,
            "attribute_2_enable": false,
            "attribute_1_selected": null,
            "attribute_2_selected": null,
            "is_gift": false,
            "gift_card_number": null,
            "checked_gift_cards": {},
            "stock_amount": 999,
            "active": true,
            "created_date": '2015/01/01',
            "original_tax": null,
            "timetables": null,
            "compositeId": '12_1',
            "size_chart" : "",
            "is_combo": false,
            "combo_price": null,
            "has_upsell": false,
            "actual_data": null,
            "max_price": null
        },
        "addJSON_without_image": {
            "image": "",
            "created_date": 12,
            "original_tax": 2
        },
        "addJSON_with_image": {
            "image": "test.png",
            "created_date": 12,
            "original_tax": 2
        },
        "addJSON_is_gift_false": {
            "image": "test.png",
            "created_date": 12,
            "is_gift": false,
            "original_tax": 2
        },
        "addJSON_is_gift_true": {
            "image": "test.png",
            "created_date": 12,
            "is_gift": true,
            "original_tax": 2
        },
        "addJSON_with_original_tax1": {
            "image": "test.png",
            "created_date": 12,
            "original_tax": '2.12'
        },
        "addJSON_with_original_tax2": {
            "image": "test.png",
            "created_date": 12,
            "original_tax": 2.12
        },
        "addJSON_without_original_tax": {
            "image": "test.png",
            "created_date": 12,
            "tax": '2.12'
        },
        "addJSON_with_created_date": {
            "image": "test.png",
            "created_date": 1234,
            "original_tax": 2
        },
        "addJSON_without_created_date": {
            "image": "test.png",
            "original_tax": 2
        },
        "addJSON_parent_without_child_products": {
            "image": "test.png",
            "original_tax": 2,
            "created_date": 123,
            "attribute_type": 1
        },
        "addJSON_parent_with_child_products": {
            "image": "test.png",
            "original_tax": 2,
            "created_date": 123,
            "attribute_type": 1,
            "child_products": [
                {
                    "product": {
                        "image": "test1.png",
                        "original_tax": 2,
                        "created_date": 123,
                        "attribute_type": 2,
                        "sort": 1,
                        "name": "Child 1"
                    }
                },
                {
                    "product": {
                        "image": "test2.png",
                        "original_tax": 4,
                        "created_date": 344,
                        "attribute_type": 2,
                        "sort": 2,
                        "name": "Child 2"
                    }
                }
            ]
        },
        "addJSON_is_combo_true": {
            "image": "test.png",
            "created_date": 12,
            "original_tax": 2,
            "is_combo": true,
            "product_sets": [{
                "name": "Product set 1",
                "id": 4,
                "is_combo_saving": false,
                "order_products": [{
                    "product": {
                        "description": null,
                        "id": 2078,
                        "id_category": 495,
                        "images": [],
                        "is_cold": false,
                        "name": "Combo item 1",
                        "price": 10,
                        "tax": 0,
                        "sort": 1
                    },
                    "modifiers": [],
                    "id_product": 2078,
                    "sum": 10,
                    "quantity": 1,
                    "weight": 0,
                    "quantity_prev": 1,
                    "special": "",
                    "initial_price": 10,
                    "discount": {
                        "id": null,
                        "name": "default",
                        "sum": 0,
                        "taxed": false,
                        "type": null
                    },
                    "stanfordCard": null,
                    "stanford_card_number": "",
                    "planId": null,
                    "isServiceFee": false,
                    "is_child_product": true,
                    "selected": true
                }, {
                    "product": {
                        "description": null,
                        "id": 2079,
                        "id_category": 495,
                        "images": [],
                        "is_cold": false,
                        "name": "Combo item 2",
                        "price": 10,
                        "img": "./skins/weborder/img/",
                        "tax": 0,
                        "sort": 2
                    },
                    "modifiers": [],
                    "id_product": 2079,
                    "sum": 10,
                    "quantity": 1,
                    "weight": 0,
                    "quantity_prev": 1,
                    "special": "",
                    "initial_price": 10,
                    "discount": {
                        "id": null,
                        "name": "default",
                        "sum": 0,
                        "taxed": false,
                        "type": null
                    },
                    "stanfordCard": null,
                    "stanford_card_number": "",
                    "planId": null,
                    "isServiceFee": false,
                    "is_child_product": true
                }],
                "minimum_amount": 1,
                "maximum_amount": 1,
                "sort": 1,
                "quantity": 1
            }, {
                "name": "Product set 2",
                "id": 5,
                "is_combo_saving": true,
                "order_products": [{
                    "product": {
                        "description": null,
                        "id": 1859,
                        "id_category": 413,
                        "image": "./skins/weborder/img/none.png",
                        "images": [],
                        "is_cold": false,
                        "name": "Coke",
                        "price": 5,
                        "img": "./skins/weborder/img/",
                        "tax": 0,
                        "sort": 1
                    },
                    "modifiers": [],
                    "id_product": 1859,
                    "sum": 5,
                    "quantity": 1,
                    "weight": 0,
                    "quantity_prev": 1,
                    "special": "",
                    "initial_price": 5,
                    "discount": {
                        "id": null,
                        "name": "default",
                        "sum": 0,
                        "taxed": false,
                        "type": null
                    },
                    "stanfordCard": null,
                    "stanford_card_number": "",
                    "planId": null,
                    "isServiceFee": false,
                    "is_child_product": true,
                    "selected": true
                }, {
                    "product": {
                        "description": "",
                        "id": 1862,
                        "id_category": 413,
                        "image": "./skins/weborder/img/none.png",
                        "images": [],
                        "is_cold": true,
                        "name": "Diet Coke",
                        "price": 5,
                        "img": "./skins/weborder/img/",
                        "tax": 0,
                        "sort": 4
                    },
                    "modifiers": [],
                    "id_product": 1862,
                    "sum": 5,
                    "quantity": 1,
                    "weight": 0,
                    "quantity_prev": 1,
                    "special": "",
                    "initial_price": 5,
                    "discount": {
                        "id": null,
                        "name": "default",
                        "sum": 0,
                        "taxed": false,
                        "type": null
                    },
                    "stanfordCard": null,
                    "stanford_card_number": "",
                    "planId": null,
                    "isServiceFee": false,
                    "is_child_product": true
                }],
                "minimum_amount": 1,
                "maximum_amount": 1,
                "sort": 2,
                "quantity": 1
            }]
        },
        "get_product_attributes": {
            "attribute_1_selected": 1,
            "attribute_1_enable": true,
            "attribute_2_selected": 2,
            "attribute_2_enable": true
        },
        "get_attribute_1_data": {
            "attribute_1_selected": 1,
            "attribute_1_enable": true,
            "attribute_1_name": 'Test 1',
        },
        "get_attribute_2_data": {
            "attribute_2_selected": 2,
            "attribute_2_enable": true,
            "attribute_2_name": 'Test 2',
        },
        "get_child_products": {
            "status": 'OK',
            "data": [{
                "product": {
                    "name": 'Test',
                    "price": 10,
                    "stock_amount": 5
                }
            }]
        },
        "modelId_item_without_compositeId": {
            "name": 'test',
            "image": 'test.png',
            "id": 12,
            "price": 123
        },
        "modelId_item_with_compositeId": {
            "name": 'test',
            "image": 'test.png',
            "id": 12,
            "price": 123,
            "compositeId": '12_23'
        },
        "get_products_without_gift_card": [
            {
                "id": 1,
                "name": 'Test 1',
                "id_category": 12,
                "timetables": null,
                "is_gift": false,
                "sort": 2
            }
        ],
        "getAttributeValues_items": [
            {
                "id": 1,
                "name": "Test 1",
                "attribute_1_name": 'Attribute 1',
                "attribute_2_name": 'Attribute 2',
                "category_id": 1,
                "attribute_type": 1,
                "attribute_1_values": ['f1', 'a1', 'c1'],
                "attribute_2_values": ['f2', 'a2', 'c2']
            },
            {
                "id": 2,
                "name": "Test 2",
                "attribute_1_name": 'Attribute 1',
                "attribute_2_name": 'Attribute 2',
                "category_id": 1,
                "attribute_type": 1,
                "attribute_1_values": ['f1', 'd1', 'e1'],
                "attribute_2_values": ['f2', 'd2', 'e2']
            },
        ],
        "addJSON_has_upsell_true": {
            "image": "test.png",
            "created_date": 12,
            "original_tax": 2,
            "is_combo": false,
            "has_upsell": true,
            "price": 8.3,
            "product_sets": [{
                "name": "Product set 1",
                "id": 4,
                "is_combo_saving": false,
                "order_products": [{
                    "product": {
                        "description": null,
                        "id": 2078,
                        "id_category": 495,
                        "images": [],
                        "is_cold": false,
                        "name": "Combo item 1",
                        "price": 4,
                        "upcharge_price": 2,
                        "tax": 0,
                        "sort": 1
                    },
                    "modifiers": [],
                    "id_product": 2078,
                    "sum": 0,
                    "quantity": 2,
                    "weight": 0,
                    "quantity_prev": 1,
                    "special": "",
                    "initial_price": 4,
                    "discount": {
                        "id": null,
                        "name": "default",
                        "sum": 0,
                        "taxed": false,
                        "type": null
                    },
                    "stanfordCard": null,
                    "stanford_card_number": "",
                    "planId": null,
                    "isServiceFee": false,
                    "is_child_product": true,
                    "selected": true
                }, {
                    "product": {
                        "description": null,
                        "id": 2079,
                        "id_category": 495,
                        "images": [],
                        "is_cold": false,
                        "name": "Combo item 2",
                        "price": 10,
                        "img": "./skins/weborder/img/",
                        "tax": 0,
                        "sort": 2
                    },
                    "modifiers": [],
                    "id_product": 2079,
                    "sum": 0,
                    "quantity": 1,
                    "weight": 0,
                    "quantity_prev": 1,
                    "special": "",
                    "initial_price": 10,
                    "discount": {
                        "id": null,
                        "name": "default",
                        "sum": 0,
                        "taxed": false,
                        "type": null
                    },
                    "stanfordCard": null,
                    "stanford_card_number": "",
                    "planId": null,
                    "isServiceFee": false,
                    "is_child_product": true
                }],
                "minimum_amount": 2,
                "maximum_amount": 2,
                "sort": 1,
                "quantity": 2
            },

                {
                "name": "Product set 2",
                "id": 5,
                "is_combo_saving": true,
                "order_products": [{
                    "product": {
                        "description": null,
                        "id": 1859,
                        "id_category": 413,
                        "image": "./skins/weborder/img/none.png",
                        "images": [],
                        "is_cold": false,
                        "name": "Coke",
                        "price": 10,
                        "upcharge_price": 3,
                        "img": "./skins/weborder/img/",
                        "tax": 0,
                        "sort": 1
                    },
                    "modifiers": [],
                    "id_product": 1859,
                    "sum": 0,
                    "quantity": 1,
                    "weight": 0,
                    "quantity_prev": 1,
                    "special": "",
                    "initial_price": 10,
                    "discount": {
                        "id": null,
                        "name": "default",
                        "sum": 0,
                        "taxed": false,
                        "type": null
                    },
                    "stanfordCard": null,
                    "stanford_card_number": "",
                    "planId": null,
                    "isServiceFee": false,
                    "is_child_product": true,
                    "selected": true
                }, {
                    "product": {
                        "description": "",
                        "id": 1862,
                        "id_category": 413,
                        "image": "./skins/weborder/img/none.png",
                        "images": [],
                        "is_cold": true,
                        "name": "Diet Coke",
                        "price": 5,
                        "img": "./skins/weborder/img/",
                        "tax": 0,
                        "sort": 4
                    },
                    "modifiers": [],
                    "id_product": 1862,
                    "sum": 5,
                    "quantity": 1,
                    "weight": 0,
                    "quantity_prev": 1,
                    "special": "",
                    "initial_price": 5,
                    "discount": {
                        "id": null,
                        "name": "default",
                        "sum": 0,
                        "taxed": false,
                        "type": null
                    },
                    "stanfordCard": null,
                    "stanford_card_number": "",
                    "planId": null,
                    "isServiceFee": false,
                    "is_child_product": true
                }],
                "minimum_amount": 1,
                "maximum_amount": 1,
                "sort": 1,
                "quantity": 1
            },


                    {
                "name": "Product set 3",
                "id": 7,
                "is_combo_saving": false,
                "order_products": [{
                    "product": {
                        "description": null,
                        "id": 1860,
                        "id_category": 413,
                        "image": "./skins/weborder/img/none.png",
                        "images": [],
                        "is_cold": false,
                        "name": "Prod 3",
                        "price": 2,
                        "upcharge_price": 1,
                        "img": "./skins/weborder/img/",
                        "tax": 0,
                        "sort": 1
                    },
                    "modifiers": [],
                    "id_product": 1859,
                    "sum": 0,
                    "quantity": 3,
                    "weight": 0,
                    "quantity_prev": 1,
                    "special": "",
                    "initial_price": 2,
                    "discount": {
                        "id": null,
                        "name": "default",
                        "sum": 0,
                        "taxed": false,
                        "type": null
                    },
                    "stanfordCard": null,
                    "stanford_card_number": "",
                    "planId": null,
                    "isServiceFee": false,
                    "is_child_product": true,
                    "selected": true
                }, {
                    "product": {
                        "description": "",
                        "id": 1863,
                        "id_category": 413,
                        "image": "./skins/weborder/img/none.png",
                        "images": [],
                        "is_cold": true,
                        "name": "Diet Prod 3",
                        "price": 5,
                        "img": "./skins/weborder/img/",
                        "tax": 0,
                        "sort": 4
                    },
                    "modifiers": [],
                    "id_product": 1862,
                    "sum": 5,
                    "quantity": 1,
                    "weight": 0,
                    "quantity_prev": 1,
                    "special": "",
                    "initial_price": 5,
                    "discount": {
                        "id": null,
                        "name": "default",
                        "sum": 0,
                        "taxed": false,
                        "type": null
                    },
                    "stanfordCard": null,
                    "stanford_card_number": "",
                    "planId": null,
                    "isServiceFee": false,
                    "is_child_product": true
                }
                ],
                "minimum_amount": 3,
                "maximum_amount": 3,
                "sort": 2,
                "quantity": 3
            }]
        },
    };
});

