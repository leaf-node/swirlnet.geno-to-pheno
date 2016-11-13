// Copyright 2016 Andrew Engelbrecht
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


var genoToPheno, util, swirlnetPhenotypeVersion, assert;

util = require('swirlnet.util');
assert = require('assert');

swirlnetPhenotypeVersion = "0.0";

// converts between swirlnetGenome and swirlnetPhenotype
genoToPheno = function (swirlnetGenome) {

    "use strict";

    var phenotype, genome,
        i, innovNumber,
        activationFunction,
        weight, position,
        upstream, downstream, gene, role, nodeID,
        nextNodeID, innovationNodeIDMap, getNodeID,
        node;

    assert(typeof swirlnetGenome === "string",
            "swirlnet: internal error: invalid format. genome must be a string.");

    genome = JSON.parse(swirlnetGenome);

    assert(genome.format === "swirlnetGenome",
            "swirlnet: internal error: invalid format: " + genome.format);
    assert(genome.version === "0.0",
            "swirlnet: internal error: invalid genome version: " + genome.version);
    assert(genome.type === "classic",
            "swirlnet: internal error: invalid genome type: " + genome.type);

    phenotype = {
        "format": "swirlnetPhenotype",
        "version": swirlnetPhenotypeVersion,
        "generation": genome.generation,
        "genomeID": genome.genomeID,
        "roles": {"bias": [], "input": [], "output": [], "hidden": []},
        "functions": {},
        "connections": [],
        "settings": {}
    };

    // translates genome node numbers to phenotype node numbers
    nextNodeID = 0;
    innovationNodeIDMap = [];
    getNodeID = function (innovationNumber) {

        if (innovationNodeIDMap[innovationNumber] === undefined) {
            innovationNodeIDMap[innovationNumber] = nextNodeID;
            nextNodeID += 1;
        }

        return innovationNodeIDMap[innovationNumber];
    };

    for (i in genome.genes) {
        if (genome.genes.hasOwnProperty(i)) {

            gene = genome.genes[i];
            innovNumber = gene[0];

            if (gene !== null) {

                if (gene[1] === "node") {

                    role = gene[2];
                    activationFunction = gene[3];
                    position = gene[4];

                    nodeID = getNodeID(innovNumber);

                    if (role === "hidden" || role === "bias") {
                        assert(position === undefined || position === null,
                                "swirlnet: internal error: invalid position for hidden or bias node: " + position);
                        phenotype.roles[role].push(nodeID);
                    } else {
                        assert(phenotype.roles[role][position] === undefined,
                                "swirlnet: internal error: multiple nodes share the same position: " + position);
                        phenotype.roles[role][position] = nodeID;
                    }

                    if (activationFunction !== null) {
                        phenotype.functions[activationFunction] = phenotype.functions[activationFunction] || [];
                        phenotype.functions[activationFunction].push(nodeID);
                    }

                    phenotype.connections[nodeID] = phenotype.connections[nodeID] || {};

                } else if (gene[1] === "connection") {

                    if (gene[2] === true) {

                        upstream = getNodeID(gene[3]);
                        downstream = getNodeID(gene[4]);
                        weight = gene[5];

                        phenotype.connections[upstream] = phenotype.connections[upstream] || {};
                        phenotype.connections[upstream][downstream] = weight;
                    }
                }
            }
        }
    }

    // this assures that there are no gaps in the array of inputs and
    // outputs whose placement is determined by genetically specified node
    // positions.
    for (i = 0; i < phenotype.roles.input.length; i += 1) {
        node = phenotype.roles.input[i];
        assert(util.isInt(node),
                "swirlnet: internal error: invalid node ID: " + node + " at position: " + i);
    }

    for (i = 0; i < phenotype.roles.output.length; i += 1) {
        node = phenotype.roles.output[i];
        assert(util.isInt(node),
                "swirlnet: internal error: invalid node ID: " + node + " at position: " + i);
    }

    assert(phenotype.roles.output.length > 0,
                "swirlnet: internal error: invalid number of output nodes: " + phenotype.roles.bias.length + " (should be greater than 0)");
    assert(phenotype.roles.bias.length === 1,
                "swirlnet: internal error: invalid number of bias nodes: " + phenotype.roles.bias.length + " (should be 1)");


    phenotype.settings.sigmoidSteepness = genome.netSettings.sigmoidSteepness;
    phenotype.settings.biasValue = genome.netSettings.biasValue;

    return JSON.stringify(phenotype);
};


module.exports = genoToPheno;


