---
layout: post
title: Discovering how complex networks are built from simple parts
author: Thomas Gorochowski
people-tags: 
  - Thomas Gorochowski
image: /images/posts/2018-03-28-motif-clustering.jpg
readmore: true
---
Today our work on unravelling the rules for how complex networks are built from simple complements is published in [Science Advances](http://advances.sciencemag.org). We develop new methods that can extract and decipher the rules controlling how small structures cluster and connect, and show that common components to many networks are often used in surprisingly different ways. The final paper can be accessed [here](http://advances.sciencemag.org/content/4/3/eaap9751).

Networks can be used to capture interactions and connections in complex systems; from who eats who in food webs, to airline routes in transportation systems. An intriguing feature of many networks is that some small structures, commonly called 'motifs', are found much more often than we would expect. It is thought motifs act like building blocks for larger systems, but so far it has been difficult to investigate this idea fully.

To address this, we developed new methods to discover how these small structures cluster and connect together. The method works by taking a complex system and searching throughout to find the location of every "simple" building block. We then look at each of these in turn and see how it is connected to any others nearby. There are a limited number of ways that two parts can connect and we classify each connection in terms of these. The types of connection used are sort of like "assembly instructions" for the system.

We applied our approach to many biological and man-made networks including: food webs, connections of neurons in a simple organism, regulatory networks inside many types of cell (both genetic and metabolic), airline routes in the USA, a computer network called Gnutella used for sharing files, voting in Wikipedia, and a network constructed from emails sent within an EU organisation. In all the networks, the motifs/parts we considered were connected in a slightly different way, but networks from a particular area (e.g. multiple cellular networks from distantly related organisms) displayed very similar patterns.

Being able to extract the assembly instructions of a complex networked system is important. It helps us understand how a system is built, gives insight into how it works, and open up the opportunity to fix it when it misbehaves. One area where this information is very useful is synthetic biology. In this field, we would like to be able to engineer new types of cell to produce valuable chemicals/drugs or alter their behaviour in useful ways, e.g., to hunt down disease in our bodies. To create these sorts of systems, we need to understand how biological parts should be combined to work effectively. Our findings provide this sort of information and can help guide new approaches to engineering biology.
