// some_header_file.h
#ifndef EPOCH_HEADER_FILE_H
#define EPOCH_HEADER_FILE_H

#include <iostream>
#include <string>
#include <vector>
#include <map>

// your code


class EqStats{
    public:
        std::map<std::string, int> opers;
        std::map<std::string, int> keys;
        float score() const;
};

class ASTNode{
    bool _isLeaf;
    std::string key;
    std::string oper;
    std::vector<ASTNode> children;
    public:
        ASTNode();
        ASTNode(const std::string &);
        ASTNode(const std::string &, const std::vector<ASTNode>&);
        ASTNode(const ASTNode &);
        void toInfix(std::stringstream &) const;
        void toPrefix(std::stringstream &) const;
        void stats(EqStats&) const;
        bool isLeaf() const;
        bool normalize();
};

class Equation{
    ASTNode ast;
    public:
        void normalize();
        float score() const;
        Equation(const ASTNode& n);
        void toInfix(std::stringstream &) const;
        void toPrefix(std::stringstream &) const;
};

// class MyClass {       // The class
//   public:             // Access specifier
//     int myNum;        // Attribute (int variable)
//     string myString;  // Attribute (string variable)
// };

#endif