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

    cyborg.createMatch = function(config, scenarioName) {
        var result = [];
        var possibles = [];
        var scenario = config.scenarios[
            scenarioName || config.scenarioDefault];
        var rolesUsed = {};
        var namesUsed = {};

        // Build a list of possible roles for each position
        Object.keys(scenario).forEach(function(faction) {
            rolesUsed[faction] = {};

            Object.keys(scenario[faction]).forEach(function(category) {
                var count = scenario[faction][category];
                var current;

                while (count-- > 0) {
                    current = {faction: faction, category: category,
                               roles: []};
                    possibles.push(current);

                    Object.keys(config.roles).forEach(function(roleName) {
                        var role = config.roles[roleName];

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
            var current;
            var chosen = undefined;
            var name = undefined;
            var count;

            shuffle(possible.roles);
            while (!chosen && possible.roles.length) {
                current = possible.roles.pop();
                if (!config.roles[current] ||
                    !config.roles[current].unique ||
                    !rolesUsed[possible.faction][current])
                    chosen = current;
            }

            if (chosen) {
                count = 20;
                while (!name && (count-- > 0)) {
                    name = revgram.generate(config.names, 'start');
                    if (name in namesUsed)
                        name = undefined;
                    else namesUsed[name] = true;
                }

                result.push({name: name, faction: possible.faction,
                             role: chosen});
                rolesUsed[possible.faction][chosen] = true;
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
