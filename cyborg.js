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
        var rolesUsed = {};
        var namesUsed = {};
        var scenario = config.scenarios[
            scenarioName || config.scenarioDefault];

        // Build a list of possible roles for each position
        Object.keys(scenario).forEach(function(faction) {
            rolesUsed[faction] = {};

            Object.keys(scenario[faction]).forEach(function(category) {
                var count = scenario[faction][category];
                var current;

                for (var count = scenario[faction][category];
                    count > 0; --count) {
                    current = {faction: faction, category: category,
                               roles: []};
                    possibles.push(current);

                    Object.keys(config.roles).forEach(function(roleName) {
                        var role = config.roles[roleName];

                        if (!role.experimental &&
                            (category === 'any' ||
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

                result.push({
                    name: name, faction: possible.faction, role: chosen,
                    defense: config.roles[chosen].defense || 0,
                    dead: false});
                rolesUsed[possible.faction][chosen] = true;
            } else throw {error: "No role choice possible",
                          faction: possible.faction,
                          category: possible.category};
        });

        return shuffle(result);
    };

    cyborg.detect = function(config, role) {
        var categories = config.abilities.detect.categories;
        var result = [];

        categories.forEach(function(list) {
            var found = false;
            list.forEach(function(current) {
                if (current === role)
                    found = true;
            });
            if (found)
                result = list;
        });
        return result;
    };

    cyborg.apply = function(config, match) {
        var events = [];
        var victims = [], victim;
        var infiltrators = [];
        var attacker = undefined;

        match.forEach(function(entry) {
            if (entry.dead) {
                // Dead entries can't attack or be attacked
            } else if (entry.faction === 'infiltrator') {
                infiltrators.push(entry);
                if (entry.role === 'commander' && !attacker)
                    attacker = entry;
                else if (entry.role === 'soldier')
                    attacker = entry;
            } else victims.push(entry);
        });
        if (!attacker && infiltrators.length) {
            attacker = shuffle(infiltrators)[0];
            attacker.role = 'soldier';
        }
        if (attacker && victims.length) {
            victim = shuffle(victims)[0];
            if (victim.defense-- <= 0) {
                victim.dead = true;
                events.push("Infiltrators have killed " + victim.name);
            }
        }
        return events;
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
