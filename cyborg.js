// cyborg.js
// Copyright (C) 2017 by Simon Gold and Jeff Gold.
//
// A deductive puzzle game

(function(cyborg) {
    'use strict';

    // Randomize the order of an array in place, using an optional
    // random number generator
    var shuffle = function(elements, rand) {
        var ii, jj, swap;

        if (!rand || !rand.random)
            rand = Math;
        for (ii = elements.length; ii; --ii) { // swap at random
            jj = Math.floor(rand.random() * ii);
            swap = elements[ii - 1];
            elements[ii - 1] = elements[jj];
            elements[jj] = swap;
        }
        return elements;
    }

    var chooseRole = function(roles, existing, faction, category) {
        var possibilities = [];

        Object.keys(roles).forEach(function(roleName) {
            var role = roles[roleName];

            if ((category === 'any' || category === role['category'] ||
                 category === roleName) &&
                (!role['restriction'] ||
                 role['restriction'] == faction) &&
                (!role['unique'] || !(roleName in existing)))
                possibilities.push([faction, roleName]);
            console.log(roleName, role['category'], role['restriction'], role['unique'], ':::', category, faction, possibilities);
        });

        console.log(possibilities);
        return shuffle(possibilities)[0];
    };

    var createRoleList = function(data) {
        var roles = [];
        var scenario = data.scenarios[data.scenarioDefault];

        Object.keys(scenario).forEach(function(faction) {
            Object.keys(scenario[faction]).forEach(function(category) {
                var count = scenario[faction][category];
                while (count-- > 0)
                    roles.push(chooseRole(
                        data.roles, roles, faction, category));
            });
        });
        return roles;
    };

    cyborg.start = function($, callback) {
        $.getJSON('cyborg.json')
         .done(function(data) {
             callback(createRoleList(data));
         })
         .fail(function(jqxhr, textStatus, error) {
             var err = textStatus + ", " + error;
             console.log( "Request Failed: " + err );
         });
    };

})(typeof exports === 'undefined'? this['cyborg'] = {}: exports);

if ((typeof require !== 'undefined') && (require.main === module)) {
    var fs = require('fs');
    var settings = fs.readFileSync('./cyborg.json');

    console.log(settings.startStage);
}
