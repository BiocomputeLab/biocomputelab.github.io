---
layout: post
title: "Come join us for the Google Summer of Code and work on the next-generation of genetic circuit visualisation"
author: Thomas Gorochowski
people-tags: 
  - Thomas Gorochowski
---

# Beautiful rendering of complex genetic designs in Python with DNAplotlib and the Synthetic Biology Open Language (SBOL)

## Background

DNAplotlib is a Python library that enables highly customizable visualization of genetic circuits for synthetic biology. DNAplotlib is capable of rendering both nucleotide-level representations in addition to high-level schematics of genetic systems. The former, "traced-based" visualization method allows synthetic biologists to overlay experimental data like RNA-seq read depths onto a genetic design. The latter includes standard-compliant schematics based on SBOL Visual. Publication quality vector-based output is produced by using matplotlib as a canvas, and all aspects of the rendering process can be easily customized or replaced by the user. For more information about the library and many examples of figures produced, see our recent publication (http://pubs.acs.org/doi/abs/10.1021/acssynbio.6b00252) or visit the development website at http://dnaplotlib.org/.

The Synthetic Biology Open Language (SBOL) is an open standard for representing genetic designs through a standardized vocabulary of schematic glyphs (SBOL Visual) as well as a standardized RDF/XML data exchange format (SBOL Data). The standard was developed to support design-build-test workflows for synthetic biology. Recently, version 2 of the standard was released, enabling representation of modular and hierarchical biosystems and communication with cloud-based, bioparts repositories (http://pubs.acs.org/doi/abs/10.1021/acssynbio.5b00215). Libraries that allow reading/writing of files in SBOL format are available in Python, Javascript, C++, and Java.

## Goal

At present, DNAplotlib requires that genetic designs are generated through code or provided in simple GTF formatted files that are unable to describe complex design features. The Synthetic Biology Open Language supports many advanced capabilities that go beyond what is currently possible in DNAplotlib. We want to harness the powerful features of SBOL version 2 to enable complex visual representations of modular and hierarchical genetic designs. This will enable DNAplotlib to be interoperable with the growing community of BioCAD tools currently being developed.

To make this possible, there are two main goals for the project. The first is to integrate DNAplotlib with the pySBOL library (https://github.com/SynBioDex/pysbol2) in order to support reading and writing of genetic designs as SBOL2 files. This requires mapping DNAplotlib's internal representation of a genetic circuit onto the standard SBOL data model. The second goal of the project is to implement advancements to the underlying rendering pipeline to support the significant new features we have planned. This will include many diverse and fun problems such as: (i) encoding thematic styling information by leveraging SBOL's built-in support for user-defined annotations; (ii) enabling the visualization of genetic designs consisting of modules split across many physical pieces of DNA and allow them to be rendered at user specified locations; and  (iii) developing new functionality to enable the interactive exploration of hierarchical designs. These are only a few of the possible directions and this aspect of the project can be tailored to suit a students interests.

To aid with development, there is the option to connect with the [International Genetic Engineered Machines (iGEM)](http://www.igem.org) competition that will run simultaneously during the same summer period. iGEM will include student teams from all over the globe working on synthetic biology projects and requiring the visualization of many genetic circuits. This would offer a perfect opportunity to test out new features and broaden the impact of this work.

**Keywords:** Synthetic Biology, Python, Visualization, matplotlib, SBOL, SBOL Visual, RDF/XML.

### Part 1: Integration of SBOL2 support

- Integration of pySBOL2 to enable loading of designs from SBOL2 files

### Part 2: Next-generation rendering pipeline

- Ability to split a design and draw part of circuits at different positions
- Automated routing of connections between separated components
- Helper functions to enable close integration with standard matplotlib plots
- Ability to easily animate circuit dynamics
- Callback functions to enable interactive visualizations
- Theming engine with style sheets
- New annotations within SBOL2 files to store styling and layout data
- Integration with Jupyter/IPython notebooks (http://jupyter-notebook-beginner-guide.readthedocs.io/en/latest/what_is_jupyter.html)

### Student requirements

Students need not have any experience with biology, but it would help to be proficient in Python with some experience using matplotlib. Students will have some flexibility in choosing which aspects of the project they want to work on. Students will be required to familiarize themselves with core aspects of the SBOL specification (http://sbolstandard.org/downloads/specifications/specification-data-model-2-1-0/)

## Mentors

1. Thomas Gorochowski, University of Bristol, UK (thomas.gorochowski@bristol.ac.uk)
2. Bryan Bartley, University of Washington, USA (bartleyba@sbolstandard.org)

## Contact

For further information please contact Thomas Gorochowski ([thomas.gorochowski@bristol.ac.uk](mailto:thomas.gorochowski@bristol.ac.uk)) of the [Biocompute Lab](http://www.biocomputelab.org) at the University of Bristol.