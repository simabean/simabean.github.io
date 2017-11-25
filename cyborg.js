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

    cyborg.createRoleList = function(data, list) {
        var result = [];
        var possibles = [];
        var scenario = data.scenarios[list];
        var selected = {};

        // Build a list of possible roles for each position
        Object.keys(scenario).forEach(function(faction) {
            selected[faction] = {};

            Object.keys(scenario[faction]).forEach(function(category) {
                var count = scenario[faction][category];
                var current;

                while (count-- > 0) {
                    current = {faction: faction, category: category,
                               roles: []};
                    possibles.push(current);

                    Object.keys(data.roles).forEach(function(roleName) {
                        var role = data.roles[roleName];

                        if ((category === 'any' ||
                             category === role['category'] ||
                             category === roleName) &&
                            (!role['restriction'] ||
                             role['restriction'] == faction))
                            current.roles.push(roleName);
                    });
                }
            });
        });

        possibles.sort(function(a, b) {
            return (a.roles.length < b.roles.length) ? -1 :
                   ((a.roles.length > b.roles.length) ? 1 : 0); });
        possibles.forEach(function(possible) {
            var current, chosen = undefined;

            shuffle(possible.roles);
            while (!chosen && possible.roles.length) {
                current = possible.roles.pop();
                if (!data.roles[current] ||
                    !data.roles[current].unique ||
                    !selected[possible.faction][current])
                    chosen = current;
            }

            if (chosen) {
                result.push({faction: possible.faction,
                             role: chosen});
                selected[possible.faction][chosen] = true;
            } else throw {faction: possible.faction,
                          category: possible.category};
        });

        return shuffle(result);
    };

    cyborg.start = function($, callback) {
        $.getJSON('cyborg.json')
         .done(callback)
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
